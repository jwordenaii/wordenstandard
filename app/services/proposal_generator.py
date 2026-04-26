"""
proposal_generator.py — GPT-4o professional proposal generator for JWordenAI.

Generates polished PDF proposals for asphalt paving projects.
Falls back to a template-based response when OpenAI is unavailable.

Public API
──────────
  generate_proposal_text(lead: dict) → str
  generate_proposal_pdf(lead: dict) → bytes
"""

from __future__ import annotations

import base64
import io
import logging
import os
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

_COMPANY_NAME = "J. Worden & Sons Asphalt Paving"
_COMPANY_ADDRESS = "1601 Ware Bottom Springs Rd Suite 214, Chester, VA 23836"
_COMPANY_PHONE = "(804) 446-1296"
_COMPANY_EMAIL = os.getenv("NOTIFY_TO_EMAIL", "").split(",")[0].strip() or "info@jwordenasphalt.com"
_COMPANY_LICENSE = "Licensed & Insured | VA Class A Contractor"


def generate_proposal_text(lead: dict) -> str:
    """
    Call GPT-4o to generate a professional proposal text.
    Falls back to a formatted template if OpenAI is unavailable.
    """
    openai_key = os.getenv("OPENAI_API_KEY", "")
    if not openai_key:
        return _template_proposal(lead)

    try:
        from openai import OpenAI  # type: ignore

        client = OpenAI(api_key=openai_key)
        prompt = _build_gpt_prompt(lead)

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a professional estimator at J. Worden & Sons Asphalt Paving. "
                        "Write polished, client-ready project proposals. Be specific, confident, "
                        "and professional. Include all sections requested."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=1200,
            temperature=0.4,
        )
        return response.choices[0].message.content or _template_proposal(lead)
    except Exception as exc:  # noqa: BLE001
        logger.error("GPT-4o proposal generation failed: %s", exc)
        return _template_proposal(lead)


def _build_gpt_prompt(lead: dict) -> str:
    return f"""Write a professional asphalt paving proposal for the following client.

CLIENT INFO:
  Name: {lead.get('name', 'Valued Customer')}
  Address: {lead.get('address', 'N/A')}
  State: {lead.get('state_code') or lead.get('state', 'N/A')}
  Email: {lead.get('email', 'N/A')}
  Phone: {lead.get('phone', 'N/A')}

PROJECT DETAILS:
  Service: {lead.get('service_type', 'Asphalt Paving')}
  Property Type: {lead.get('property_type', 'Commercial')}
  Area: {lead.get('project_size_sqft', 'TBD')} sq ft
  Urgency: {lead.get('urgency', 'flexible')}
  Special Notes: {lead.get('message', 'None')}

PRICING RANGE: ${lead.get('price_low', 'TBD')} – ${lead.get('price_high', 'TBD')}

Please write a complete proposal including:
1. Professional greeting and project overview
2. Detailed scope of work
3. Materials and specifications (HMA type, thickness, base prep)
4. Pricing summary with the range above
5. Project timeline estimate
6. 1-year workmanship warranty terms
7. Payment terms (50% mobilization, 50% on completion)
8. Professional closing with call to action

Format with clear section headers."""


def _template_proposal(lead: dict) -> str:
    today = datetime.now(timezone.utc).strftime("%B %d, %Y")
    name = lead.get("name", "Valued Customer")
    address = lead.get("address", "Project Address TBD")
    service = lead.get("service_type", "Asphalt Paving").replace("_", " ").title()
    sqft = lead.get("project_size_sqft", "TBD")
    price_low = lead.get("price_low", "Contact for pricing")
    price_high = lead.get("price_high", "")

    price_str = f"${price_low:,} – ${price_high:,}" if isinstance(price_low, (int, float)) else str(price_low)

    return f"""J. WORDEN & SONS ASPHALT PAVING
Project Proposal
Date: {today}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PREPARED FOR:
{name}
{address}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCOPE OF WORK:
Service Type: {service}
Estimated Area: {sqft} sq ft

J. Worden & Sons Asphalt Paving proposes to furnish all materials,
equipment, and labor necessary to complete the {service.lower()} project
at the above-referenced location.

WORK INCLUDES:
• Site preparation and subgrade inspection
• Installation of hot mix asphalt (HMA) per VDOT/state specifications
• Proper compaction to achieve 92–96% density
• Final grading and cleanup

PRICING SUMMARY:
Estimated Total: {price_str}
(Final price subject to site inspection and material costs at time of work)

TIMELINE:
• Mobilization within 5–10 business days of signed contract
• Project duration: 1–3 days depending on scope

WARRANTY:
J. Worden & Sons provides a 1-year workmanship warranty on all paving work.
Material warranties follow manufacturer specifications.

PAYMENT TERMS:
• 50% deposit due upon contract execution
• 50% balance due upon project completion

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{_COMPANY_NAME}
{_COMPANY_ADDRESS}
Phone: {_COMPANY_PHONE}
{_COMPANY_LICENSE}

To accept this proposal, please sign and return with your deposit.
We look forward to earning your business!
"""


def generate_proposal_pdf(lead: dict) -> bytes:
    """
    Generate a branded PDF proposal using ReportLab.
    Returns raw PDF bytes. Falls back to plain-text PDF if ReportLab unavailable.
    """
    try:
        from reportlab.lib import colors  # type: ignore
        from reportlab.lib.pagesizes import letter  # type: ignore
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle  # type: ignore
        from reportlab.lib.units import inch  # type: ignore
        from reportlab.platypus import (  # type: ignore
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        )

        proposal_text = generate_proposal_text(lead)
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=0.75 * inch,
            bottomMargin=0.75 * inch,
        )

        styles = getSampleStyleSheet()
        brand_orange = colors.HexColor("#f5a623")
        dark = colors.HexColor("#1a1a2e")

        header_style = ParagraphStyle(
            "Header",
            parent=styles["Title"],
            fontSize=22,
            textColor=dark,
            spaceAfter=4,
        )
        sub_style = ParagraphStyle(
            "Sub",
            parent=styles["Normal"],
            fontSize=10,
            textColor=colors.grey,
            spaceAfter=12,
        )
        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            spaceAfter=6,
        )

        story = []

        # Header
        story.append(Paragraph(_COMPANY_NAME, header_style))
        story.append(Paragraph(f"{_COMPANY_ADDRESS} | {_COMPANY_PHONE}", sub_style))
        story.append(HRFlowable(width="100%", thickness=3, color=brand_orange, spaceAfter=12))

        story.append(Paragraph("PROJECT PROPOSAL", styles["Heading2"]))
        story.append(Paragraph(f"Date: {datetime.now(timezone.utc).strftime('%B %d, %Y')}", body_style))
        story.append(Spacer(1, 0.15 * inch))

        # Client info table
        client_data = [
            ["Prepared For:", lead.get("name", "Valued Customer")],
            ["Address:", lead.get("address", "TBD")],
            ["Email:", lead.get("email", "N/A")],
            ["Phone:", lead.get("phone", "N/A")],
            ["Service:", lead.get("service_type", "Paving").replace("_", " ").title()],
            ["Area:", f"{lead.get('project_size_sqft', 'TBD')} sq ft"],
        ]
        t = Table(client_data, colWidths=[1.5 * inch, 5 * inch])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f9f9f9")),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#f9f9f9")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.2 * inch))

        # Proposal body (split by lines)
        story.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey, spaceAfter=8))
        for line in proposal_text.split("\n"):
            clean = line.strip()
            if not clean:
                story.append(Spacer(1, 0.05 * inch))
            elif clean.startswith("━") or clean.startswith("─"):
                story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))
            elif clean.isupper() and len(clean) < 50:
                story.append(Paragraph(clean, styles["Heading3"]))
            else:
                story.append(Paragraph(clean.replace("•", "&#8226;"), body_style))

        # Footer
        story.append(Spacer(1, 0.3 * inch))
        story.append(HRFlowable(width="100%", thickness=2, color=brand_orange, spaceAfter=8))
        story.append(Paragraph(
            f"<i>{_COMPANY_NAME} · {_COMPANY_LICENSE}</i>",
            ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8, textColor=colors.grey, alignment=1),
        ))

        doc.build(story)
        buffer.seek(0)
        return buffer.read()

    except ImportError:
        logger.warning("ReportLab not installed — returning plain text as PDF bytes")
        text = generate_proposal_text(lead)
        return text.encode("utf-8")
    except Exception as exc:  # noqa: BLE001
        logger.error("PDF generation error: %s", exc)
        text = generate_proposal_text(lead)
        return text.encode("utf-8")
