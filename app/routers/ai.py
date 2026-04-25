"""
AI endpoints for JWordenAI.

photo-inspect  — GPT-4 Vision asphalt damage assessment (existing)
chat           — Natural language Q&A about construction law / paving services
"""

import os
import base64
import logging
from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from typing import Optional
from ..core.security import verify_premium_security

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

_ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
_MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


# ── Photo Inspect ─────────────────────────────────────────────────────────────

def _stub_analysis() -> dict:
    return {
        "engine": "stub",
        "damage_detected": True,
        "severity": "moderate",
        "findings": [
            {
                "type": "longitudinal_cracking",
                "coverage_pct": 12,
                "urgency": "address within 6 months",
            },
            {
                "type": "surface_oxidation",
                "coverage_pct": 35,
                "urgency": "sealcoating recommended this season",
            },
        ],
        "recommended_services": ["crack_filling", "sealcoating"],
        "estimated_lifespan_years": 3,
        "notes": (
            "Set OPENAI_API_KEY to enable real vision-based analysis. "
            "This is a demonstration response."
        ),
    }


def _openai_analysis(image_bytes: bytes, mime_type: str) -> dict:
    import json
    try:
        from openai import OpenAI  # type: ignore

        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        b64 = base64.b64encode(image_bytes).decode()
        data_url = f"data:{mime_type};base64,{b64}"

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert asphalt inspector. Analyze the provided "
                        "image and return a JSON object with: damage_detected (bool), "
                        "severity (none/minor/moderate/severe), findings (list of "
                        "{type, coverage_pct, urgency}), recommended_services (list), "
                        "estimated_lifespan_years (int), notes (str). "
                        "Return only valid JSON, no markdown fences."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": data_url}},
                        {"type": "text", "text": "Inspect this asphalt surface."},
                    ],
                },
            ],
            max_tokens=600,
        )

        text = response.choices[0].message.content or ""
        # Strip markdown code fences if model adds them
        if "```" in text:
            text = text.split("```")[1].lstrip("json").strip()
        result = json.loads(text)
        result["engine"] = "gpt-4o"
        return result
    except Exception as exc:  # noqa: BLE001
        logger.error("OpenAI vision call failed: %s", exc)
        fallback = _stub_analysis()
        fallback["engine"] = "stub_fallback"
        fallback["error"] = str(exc)
        return fallback


@router.post(
    "/photo-inspect",
    summary="AI asphalt damage assessment from photo",
)
async def photo_inspect(
    file: UploadFile = File(...),
    security: dict = Depends(verify_premium_security),
):
    if file.content_type not in _ALLOWED_MIME:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type. Allowed: {', '.join(_ALLOWED_MIME)}",
        )

    image_bytes = await file.read()
    if len(image_bytes) > _MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds 10 MB limit")

    openai_key = os.getenv("OPENAI_API_KEY", "")
    if openai_key:
        analysis = _openai_analysis(image_bytes, file.content_type)
    else:
        analysis = _stub_analysis()

    return {
        "status": "success",
        "tenant": security["tenant_id"],
        "analysis": analysis,
    }


# ── AI Chat ───────────────────────────────────────────────────────────────────

_CHAT_SYSTEM_PROMPT = """You are JWordenAI — the intelligent assistant for J. Worden & Sons Asphalt Paving.

COMPANY FACTS (verified — do not contradict):
• Founded 1984 by Mr. Worden's grandfather after 30+ years in roofing
• Mr. Worden started working in the field at age 14; took over the company in 2016
• Headquarters: Chester, Virginia (1601 Ware Bottom Springs Rd Suite 214)
• Phone: (804) 446-1296
• KFC national franchise paving: VA, NC, GA, FL, MI, TX, KS, MO, IA, MN, NY, NJ and more
• KFC new store builds (ground-up QSR construction) under national program, 2016–2023
• Awards: Pavement Magazine Top 75 (4 categories), Best of Houzz (multiple years),
  2026 Top Contractor Award Nominee
• Full photo documentation: Dropbox + Google Photos archive of all major projects

YOUR EXPERTISE:
1. Asphalt paving, sealcoating, crack filling, parking lots, driveways, QSR/franchise site work
2. Construction law across all 50 US states: contractor licensing, mechanics lien laws,
   prompt payment rules, contract law, prevailing wage, 811/utility rules, OSHA, permits
3. Pricing guidance (national baseline, adjusted by state labor and material costs):
   Residential paving $3.50–$8.00/sqft · Commercial $2.50–$6.00/sqft ·
   Sealcoating $0.15–$0.35/sqft · Crack fill $0.40–$1.00/sqft
4. QSR/franchise site standards: ADA drive-thru widths, brand documentation, tolerances
5. Project best practices: HMA temps, compaction density, base prep, drainage

RULES:
• Be confident and direct — 2–4 sentences for simple Q&A
• For state-specific legal questions, always add: "Verify with a licensed attorney — laws change."
• For pricing, mention the free on-site quote at /quote
• Never invent project details not listed above
• If asked who owns the company, say "Mr. Worden" — do not use first names
• If confidence is low on a specific fact, say so clearly"""


class ChatRequest(BaseModel):
    # 1000 chars ≈ ~250 tokens — well within gpt-4o-mini's context window while
    # preventing abuse of the public endpoint
    question: str = Field(..., min_length=1, max_length=1000, strip_whitespace=True)
    state_code: Optional[str] = Field(default=None, max_length=2)


class ChatResponse(BaseModel):
    answer: str
    engine: str


def _stub_chat(question: str) -> str:
    q = question.lower()
    if any(w in q for w in ["bond", "license", "licens"]):
        return (
            "Contractor licensing and bond requirements vary significantly by state. "
            "Most states require a state contractor's license plus a surety bond ranging from $10,000 to $100,000. "
            "Visit the Advisory Board at /advisory to look up your specific state's requirements — "
            "or contact us at /contact and we'll point you in the right direction."
        )
    if any(w in q for w in ["lien", "payment", "pay"]):
        return (
            "Mechanics lien laws and prompt payment rules differ by state. "
            "Filing deadlines typically range from 60 to 180 days from last work. "
            "Check your state's full profile at /advisory for exact deadlines and citation sources. "
            "Always consult a licensed attorney for project-specific advice."
        )
    if any(w in q for w in ["cost", "price", "estimate", "sqft", "sq ft", "how much"]):
        return (
            "Asphalt paving typically runs $2–$5/sqft for residential and $3–$7/sqft for commercial projects, "
            "depending on base condition, thickness, and region. "
            "Get a precise free estimate for your project at /quote — it takes under 2 minutes!"
        )
    if any(w in q for w in ["811", "utility", "utilities", "dig"]):
        return (
            "Always call 811 (or your state's one-call center) at least 3 business days before digging. "
            "Federal law requires it, and state penalties for hitting unmarked utilities can exceed $10,000. "
            "Our Advisory Board at /advisory/utilities has every state's 811 rules, notice periods, and tolerance zones."
        )
    if any(w in q for w in ["osha", "safety", "trenching"]):
        return (
            "OSHA 29 CFR 1926 Subpart P governs trenching and excavation safety nationally. "
            "24 states also have their own state OSHA plans with additional requirements. "
            "Check your state's safety profile at /advisory for state-specific rules and penalty schedules."
        )
    return (
        "Great question! As JWordenAI, I specialize in asphalt paving and construction law across all 50 states. "
        "You can explore the full legal reference at /advisory, get a free project estimate at /quote, "
        "or reach our team directly at /contact. What else can I help you with?"
    )


def _openai_chat(question: str, state_code: Optional[str]) -> str:
    try:
        from openai import OpenAI  # type: ignore

        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        user_msg = question
        if state_code:
            user_msg = f"[State context: {state_code.upper()}] {question}"

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": _CHAT_SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            max_tokens=300,
            temperature=0.7,
        )
        return response.choices[0].message.content or _stub_chat(question)
    except Exception as exc:  # noqa: BLE001 — openai raises many subtypes; json/network errors also possible
        logger.error("OpenAI chat call failed: %s", exc)
        return _stub_chat(question)


@router.post(
    "/chat",
    summary="JWordenAI natural language Q&A",
    response_model=ChatResponse,
)
async def chat(req: ChatRequest, db=None):
    """
    Public endpoint — no auth required.
    Uses GPT-4o / GPT-4o-mini via the premium AI engine with confidence scoring.
    Decisions below HUMAN_REVIEW_THRESHOLD are logged to the review queue.
    """
    from ..services.ai_engine import run_chat, HUMAN_REVIEW_THRESHOLD  # noqa: PLC0415
    from ..models import HumanReviewQueue  # noqa: PLC0415

    decision = run_chat(req.question, state_code=req.state_code)

    # Persist low-confidence decisions for human review
    if decision.needs_human_review:
        try:
            from ..database import SessionLocal  # noqa: PLC0415
            _db = SessionLocal()
            try:
                item = HumanReviewQueue(
                    decision_type  = "chat",
                    input_summary  = req.question[:500],
                    ai_answer      = decision.answer[:2000],
                    ai_engine      = decision.engine,
                    confidence     = decision.confidence,
                )
                _db.add(item)
                _db.commit()
            finally:
                _db.close()
        except Exception as exc:  # noqa: BLE001
            logger.warning("Could not save review queue item: %s", exc)

    return ChatResponse(answer=decision.answer, engine=decision.engine)
