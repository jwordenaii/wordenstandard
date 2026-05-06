"""
tts_service.py — Neural text-to-speech for the Mr. Worden / Jarvis voice.

Replaces the browser's built-in `SpeechSynthesisUtterance` (which sounds like
a 1990s Apple voice) with a real human-sounding neural TTS.

Provider chain (first configured one wins):
  1. ElevenLabs       — best quality, supports voice cloning.
                        Requires ELEVENLABS_API_KEY (+ optional ELEVENLABS_VOICE_ID).
  2. OpenAI tts-1-hd  — very good, ships today using existing OPENAI_API_KEY.
                        Default voice: "onyx" (deep, calm — Jarvis-like).

Returns raw MP3 bytes ready to stream to the browser as audio/mpeg.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# ── Voice profiles ───────────────────────────────────────────────────────────
# OpenAI voices: alloy, echo, fable, onyx, nova, shimmer
# Onyx = deep calm male, closest to Iron Man's J.A.R.V.I.S.

OPENAI_VOICES = {"alloy", "echo", "fable", "onyx", "nova", "shimmer"}
DEFAULT_OPENAI_VOICE = os.getenv("JARVIS_TTS_VOICE", "onyx")
DEFAULT_OPENAI_MODEL = os.getenv("JARVIS_TTS_MODEL", "tts-1-hd")  # -hd = higher quality

# ElevenLabs: paste any voice ID from your ElevenLabs library.
# "21m00Tcm4TlvDq8ikWAM" = Rachel (default fallback if user provides no ID).
DEFAULT_ELEVENLABS_VOICE = os.getenv("ELEVENLABS_VOICE_ID", "pNInz6obpgDQGcFmaJgB")  # Adam (deep male)
DEFAULT_ELEVENLABS_MODEL = os.getenv("ELEVENLABS_MODEL", "eleven_turbo_v2_5")


def _has_elevenlabs() -> bool:
    return bool(os.getenv("ELEVENLABS_API_KEY", "").strip())


def _has_openai() -> bool:
    return bool(os.getenv("OPENAI_API_KEY", "").strip())


def active_provider() -> str:
    """Which provider will be used right now."""
    if _has_elevenlabs():
        return "elevenlabs"
    if _has_openai():
        return "openai"
    return "none"


# ── ElevenLabs ───────────────────────────────────────────────────────────────

def _synthesize_elevenlabs(text: str, voice_id: Optional[str] = None) -> bytes:
    api_key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("ELEVENLABS_API_KEY missing")

    voice = voice_id or DEFAULT_ELEVENLABS_VOICE
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}"
    headers = {
        "xi-api-key": api_key,
        "accept": "audio/mpeg",
        "content-type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": DEFAULT_ELEVENLABS_MODEL,
        "voice_settings": {
            "stability": 0.45,
            "similarity_boost": 0.85,
            "style": 0.30,
            "use_speaker_boost": True,
        },
    }
    with httpx.Client(timeout=30.0) as client:
        resp = client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        return resp.content


# ── OpenAI ───────────────────────────────────────────────────────────────────

def _synthesize_openai(text: str, voice: Optional[str] = None) -> bytes:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY missing")

    chosen = (voice or DEFAULT_OPENAI_VOICE).lower()
    if chosen not in OPENAI_VOICES:
        chosen = DEFAULT_OPENAI_VOICE

    # Use raw HTTP so we don't depend on a specific openai SDK version's audio API.
    url = "https://api.openai.com/v1/audio/speech"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": DEFAULT_OPENAI_MODEL,
        "voice": chosen,
        "input": text,
        "response_format": "mp3",
        "speed": 1.0,
    }
    with httpx.Client(timeout=30.0) as client:
        resp = client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        return resp.content


# ── Public API ───────────────────────────────────────────────────────────────

# Hard cap so a runaway prompt can't burn $$$ in TTS.
MAX_CHARS = int(os.getenv("TTS_MAX_CHARS", "4000"))


def synthesize(text: str, voice: Optional[str] = None) -> tuple[bytes, str, str]:
    """
    Convert text → MP3 bytes using the best configured provider.

    Returns: (mp3_bytes, content_type, provider_used)
    Raises RuntimeError if no provider is configured or the call fails.
    """
    cleaned = (text or "").strip()
    if not cleaned:
        raise ValueError("text is empty")
    if len(cleaned) > MAX_CHARS:
        cleaned = cleaned[:MAX_CHARS]

    last_err: Optional[Exception] = None

    if _has_elevenlabs():
        try:
            audio = _synthesize_elevenlabs(cleaned, voice_id=voice)
            return audio, "audio/mpeg", "elevenlabs"
        except Exception as exc:  # noqa: BLE001
            logger.warning("ElevenLabs TTS failed, falling back to OpenAI: %s", exc)
            last_err = exc

    if _has_openai():
        try:
            audio = _synthesize_openai(cleaned, voice=voice)
            return audio, "audio/mpeg", "openai"
        except Exception as exc:  # noqa: BLE001
            logger.error("OpenAI TTS failed: %s", exc)
            last_err = exc

    raise RuntimeError(
        f"No TTS provider available (last error: {last_err}). "
        "Set OPENAI_API_KEY (default) or ELEVENLABS_API_KEY."
    )
