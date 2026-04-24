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

_CHAT_SYSTEM_PROMPT = """You are JWordenAI, the expert assistant for J. Worden & Sons Asphalt Paving — a 4th-generation family company serving the US since 1984. You specialize in:

1. Asphalt paving, sealcoating, crack filling, parking lots, and driveways
2. Construction law across all 50 US states: contractor licensing, mechanics lien laws, prompt payment rules, contract law, prevailing wage, 811/utility rules, OSHA safety, building permits, and environmental permits
3. Pricing guidance: asphalt paving runs roughly $2–$5/sqft for residential, $3–$7/sqft for commercial. Sealcoating is $0.15–$0.30/sqft. Crack filling is $1–$3/linear ft
4. Project best practices: HMA temperature requirements, compaction density, base prep, ADA compliance

When asked about specific state construction law, answer accurately and include a note to verify with a licensed attorney since laws change. When asked about paving projects, be helpful and suggest getting a free quote at /quote.

Respond conversationally in 2–4 sentences. Be confident, knowledgeable, and friendly."""


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
async def chat(req: ChatRequest):
    """
    Public endpoint — no auth required.
    Accepts a natural language question about construction law or paving services.
    Uses GPT-4o-mini when OPENAI_API_KEY is set; falls back to a curated stub.
    """
    openai_key = os.getenv("OPENAI_API_KEY", "")
    if openai_key:
        answer = _openai_chat(req.question, req.state_code)
        engine = "gpt-4o-mini"
    else:
        answer = _stub_chat(req.question)
        engine = "stub"

    return ChatResponse(answer=answer, engine=engine)
