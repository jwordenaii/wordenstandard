from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional

from ..services.lead_scorer import score_lead
from ..services.notifications import send_lead_notification

router = APIRouter(prefix="/api/v1/leads", tags=["leads"])


class QuoteRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    service_type: str           # paving | sealcoating | crackfill | parking_lot | driveway
    property_type: str          # residential | commercial
    urgency: str                # asap | within_1_week | within_1_month | flexible
    project_size_sqft: Optional[float] = None
    address: Optional[str] = None
    message: Optional[str] = None


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str


@router.post("/quote", summary="Submit a quote request")
async def submit_quote(req: QuoteRequest, background_tasks: BackgroundTasks):
    lead_data = req.model_dump()
    scoring = score_lead(lead_data)
    lead_data["score"] = scoring

    background_tasks.add_task(send_lead_notification, lead_data)

    return {
        "status": "received",
        "message": "Thank you! We will contact you within 24 hours.",
        "lead_score": scoring["label"],
        "priority": scoring["priority"],
        "follow_up_sla": scoring["follow_up_sla"],
    }


@router.post("/contact", summary="Submit a contact form message")
async def submit_contact(req: ContactRequest, background_tasks: BackgroundTasks):
    lead_data = {**req.model_dump(), "type": "contact"}
    background_tasks.add_task(send_lead_notification, lead_data)
    return {
        "status": "received",
        "message": "Thank you for reaching out! We will get back to you soon.",
    }
