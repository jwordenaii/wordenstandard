"""
tts.py — POST /api/v1/tts/speak — neural TTS for Jarvis / Mr. Worden chat.

Replaces the browser's robotic SpeechSynthesisUtterance with a real
human-sounding voice (OpenAI `onyx` by default, ElevenLabs if configured).
"""

from __future__ import annotations

import hashlib
import logging
from typing import Optional

from fastapi import APIRouter, Body, HTTPException, Request, Response
from pydantic import BaseModel, Field

from ..core.limiter import limiter
from ..services import tts_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/tts", tags=["tts"])


class SpeakRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000)
    voice: Optional[str] = Field(
        default=None,
        description="Optional voice override (e.g. 'onyx', 'echo', 'nova', or an ElevenLabs voice_id).",
    )


@router.post("/speak")
async def speak(request: Request, payload: SpeakRequest = Body(...)) -> Response:
    """
    Convert text to speech and stream MP3 back.

    Browser usage:
        const r = await fetch('/api/v1/tts/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '...' })
        });
        const blob = await r.blob();
        new Audio(URL.createObjectURL(blob)).play();
    """
    try:
        audio, content_type, provider = tts_service.synthesize(
            payload.text, voice=payload.voice
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        # No provider configured — frontend should fall back to browser TTS.
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("TTS synthesis failed")
        raise HTTPException(status_code=502, detail=f"TTS provider error: {type(exc).__name__}: {exc}") from exc

    # Light caching: identical short utterances (greetings, confirmations) re-use
    # browser cache rather than re-billing the TTS API.
    etag = hashlib.sha1(
        f"{provider}|{payload.voice or ''}|{payload.text}".encode("utf-8")
    ).hexdigest()

    return Response(
        content=audio,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=86400",
            "ETag": etag,
            "X-TTS-Provider": provider,
        },
    )


@router.get("/status")
async def status() -> dict:
    """Which TTS provider is currently active (for the admin/Jarvis status panel)."""
    import os as _os
    # Diagnostic: show which AI provider keys the container can actually see.
    def _seen(name: str) -> dict:
        v = _os.environ.get(name, "")
        return {"set": bool(v.strip()), "len": len(v)}
    return {
        "provider": tts_service.active_provider(),
        "default_voice": tts_service.DEFAULT_OPENAI_VOICE,
        "default_model": tts_service.DEFAULT_OPENAI_MODEL,
        "env_check": {
            "OPENAI_API_KEY":     _seen("OPENAI_API_KEY"),
            "ANTHROPIC_API_KEY":  _seen("ANTHROPIC_API_KEY"),
            "GOOGLE_API_KEY":     _seen("GOOGLE_API_KEY"),
            "PERPLEXITY_API_KEY": _seen("PERPLEXITY_API_KEY"),
            "XAI_API_KEY":        _seen("XAI_API_KEY"),
            "ELEVENLABS_API_KEY": _seen("ELEVENLABS_API_KEY"),
        },
    }
