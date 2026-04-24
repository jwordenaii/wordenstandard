"""
AI photo inspection endpoint.

Accepts an uploaded image of an asphalt surface and returns a damage
assessment.  When OPENAI_API_KEY is present in the environment, it calls
GPT-4 Vision.  Otherwise it returns a realistic stub response so the site
remains fully functional without credentials.
"""

import os
import base64
import logging
from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from ..core.security import verify_premium_security

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

_ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
_MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


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
    try:
        import openai  # type: ignore

        openai.api_key = os.getenv("OPENAI_API_KEY")
        b64 = base64.b64encode(image_bytes).decode()
        data_url = f"data:{mime_type};base64,{b64}"

        response = openai.ChatCompletion.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert asphalt inspector. Analyze the provided "
                        "image and return a JSON object with: damage_detected (bool), "
                        "severity (none/minor/moderate/severe), findings (list of "
                        "{type, coverage_pct, urgency}), recommended_services (list), "
                        "estimated_lifespan_years (int), notes (str)."
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
        import json

        text = response.choices[0].message["content"]
        # Extract JSON block if wrapped in markdown
        if "```" in text:
            text = text.split("```")[1].lstrip("json").strip()
        result = json.loads(text)
        result["engine"] = "gpt-4-vision"
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
