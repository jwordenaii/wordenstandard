"""
proposals.py — GPT-4o proposal generator endpoints for JWordenAI.

Routes:
  POST /api/v1/proposals/generate          — generate text + PDF proposal
  POST /api/v1/proposals/{lead_id}/send    — generate and email proposal to lead

Requires premium security.
"""


import base64
import logging
import os
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.limiter import limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import Lead
from ..services.proposal_generator import generate_proposal_text, generate_proposal_pdf
from ..services.pricing import estimate_price

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/proposals", tags=["proposals"])


class ProposalRequest(BaseModel):
    lead_id: int
    include_pdf: bool = True


def _build_lead_dict(lead: Lead, db: Session) -> dict:
    """Build a dict from a Lead ORM object, enriched with pricing."""
    pricing = estimate_price(
        lead.service_type,
        lead.property_type,
        lead.project_size_sqft or 1000,
    )
    return {
        "id": lead.id,
        "name": lead.name,
        "email": lead.email,
        "phone": lead.phone,
        "service_type": lead.service_type,
        "property_type": lead.property_type,
        "urgency": lead.urgency,
        "project_size_sqft": lead.project_size_sqft,
        "address": lead.address,
        "message": lead.message,
        "price_low": pricing["low_usd"] if pricing else "Contact for pricing",
        "price_high": pricing["high_usd"] if pricing else "",
    }


@router.post("/generate", summary="Generate a professional proposal for a lead")
@limiter.limit("10/minute")
async def generate_proposal(
    request: Request,
    req: ProposalRequest,
    db: Session = Depends(get_db),
    security: dict = Depends(verify_premium_security),
):
    """
    Generate a proposal text and optionally a PDF for the specified lead.
    Returns proposal_text and base64-encoded PDF bytes.
    """
    lead = db.get(Lead, req.lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead_dict = _build_lead_dict(lead, db)

    proposal_text = generate_proposal_text(lead_dict)

    result: dict = {
        "lead_id": lead.id,
        "lead_name": lead.name,
        "proposal_text": proposal_text,
    }

    if req.include_pdf:
        pdf_bytes = generate_proposal_pdf(lead_dict)
        result["pdf_base64"] = base64.b64encode(pdf_bytes).decode()
        result["pdf_size_bytes"] = len(pdf_bytes)

    # Update pipeline stage to proposal_sent
    try:
        from datetime import datetime, timezone  # noqa: PLC0415
        if lead.pipeline_stage in ("new", "contacted"):
            lead.pipeline_stage = "proposal_sent"
            lead.proposal_sent_at = datetime.now(timezone.utc)
            db.commit()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not update pipeline stage: %s", exc)

    return result


def _send_proposal_email(lead_dict: dict, proposal_text: str, pdf_bytes: Optional[bytes]) -> None:
    """Background task to email the proposal to the lead."""
    try:
        import smtplib  # noqa: PLC0415
        from email.mime.multipart import MIMEMultipart  # noqa: PLC0415
        from email.mime.text import MIMEText  # noqa: PLC0415
        from email.mime.application import MIMEApplication  # noqa: PLC0415

        host = os.getenv("SMTP_HOST", "")
        port = int(os.getenv("SMTP_PORT", "587"))
        user = os.getenv("SMTP_USER", "")
        password = os.getenv("SMTP_PASSWORD", "")

        if not (host and user and password):
            logger.info("SMTP not configured — proposal email skipped for %s", lead_dict.get("email"))
            return

        recipient = lead_dict.get("email", "")
        if not recipient or "@" not in recipient:
            logger.warning("Invalid recipient email for proposal: %s", recipient)
            return

        msg = MIMEMultipart("mixed")
        msg["Subject"] = f"Your Project Proposal from J. Worden & Sons Asphalt Paving"
        msg["From"] = user
        msg["To"] = recipient

        html_body = f"""
        <html><body style="font-family: sans-serif; color: #1a1a2e; max-width: 700px;">
          <div style="background: #f5a623; padding: 20px; text-align: center;">
            <h1 style="color: #1a1a2e; margin: 0;">J. Worden & Sons Asphalt Paving</h1>
            <p style="color: #1a1a2e; margin: 4px 0;">Project Proposal</p>
          </div>
          <div style="padding: 24px;">
            <p>Dear {lead_dict.get('name', 'Valued Customer')},</p>
            <p>Thank you for your interest in our services. Please find your project proposal attached.</p>
            <pre style="background: #f9f9f9; padding: 16px; border-radius: 4px; white-space: pre-wrap; font-size: 13px;">
{proposal_text[:3000]}
            </pre>
            <p>Please don't hesitate to contact us with any questions.</p>
            <p><strong>Phone:</strong> (804) 446-1296<br>
               <strong>Address:</strong> 1601 Ware Bottom Springs Rd Suite 214, Chester, VA 23836</p>
          </div>
        </body></html>
        """
        msg.attach(MIMEText(html_body, "html"))

        if pdf_bytes:
            pdf_part = MIMEApplication(pdf_bytes, _subtype="pdf")
            pdf_part.add_header(
                "Content-Disposition",
                "attachment",
                filename=f"proposal_{lead_dict.get('name', 'client').replace(' ', '_')}.pdf",
            )
            msg.attach(pdf_part)

        with smtplib.SMTP(host, port) as server:
            server.ehlo()
            server.starttls()
            server.login(user, password)
            server.sendmail(user, [recipient], msg.as_string())

        logger.info("Proposal emailed to %s", recipient)
    except Exception as exc:  # noqa: BLE001
        logger.error("Proposal email send error: %s", exc)


@router.post("/{lead_id}/send", summary="Generate and email proposal to lead")
@limiter.limit("5/minute")
async def send_proposal(
    request: Request,
    lead_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    """Generate a proposal and send it to the lead's email address."""
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if not lead.email or "@" not in lead.email:
        raise HTTPException(status_code=422, detail="Lead has no valid email address")

    lead_dict = _build_lead_dict(lead, db)
    proposal_text = generate_proposal_text(lead_dict)
    pdf_bytes = generate_proposal_pdf(lead_dict)

    background_tasks.add_task(_send_proposal_email, lead_dict, proposal_text, pdf_bytes)

    return {
        "status": "queued",
        "message": f"Proposal will be emailed to {lead.email}",
        "lead_id": lead_id,
        "lead_name": lead.name,
    }
