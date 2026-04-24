from fastapi import APIRouter, BackgroundTasks, Request
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

from ..core.limiter import limiter
from ..services.lead_scorer import score_lead
from ..services.notifications import send_lead_notification

router = APIRouter(prefix="/api/v1/leads", tags=["leads"])


class QuoteRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120, strip_whitespace=True)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=30, strip_whitespace=True)
    service_type: str = Field(..., max_length=60)   # paving | sealcoating | crackfill | parking_lot | driveway
    property_type: str = Field(..., max_length=30)  # residential | commercial
    urgency: str = Field(..., max_length=30)         # asap | within_1_week | within_1_month | flexible
    project_size_sqft: Optional[float] = Field(default=None, ge=0, le=10_000_000)
    address: Optional[str] = Field(default=None, max_length=300, strip_whitespace=True)
    message: Optional[str] = Field(default=None, max_length=2000, strip_whitespace=True)


class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120, strip_whitespace=True)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=30, strip_whitespace=True)
    message: str = Field(..., min_length=1, max_length=2000, strip_whitespace=True)


@router.post("/quote", summary="Submit a quote request")
@limiter.limit("10/minute")
async def submit_quote(request: Request, req: QuoteRequest, background_tasks: BackgroundTasks):
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
@limiter.limit("10/minute")
async def submit_contact(request: Request, req: ContactRequest, background_tasks: BackgroundTasks):
    lead_data = {**req.model_dump(), "type": "contact"}
    background_tasks.add_task(send_lead_notification, lead_data)
    return {
        "status": "received",
        "message": "Thank you for reaching out! We will get back to you soon.",
    }
