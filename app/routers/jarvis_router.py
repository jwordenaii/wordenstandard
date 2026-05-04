from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
import os
from app.services.jarvis import jarvis
from app.services import autonomy_state
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/jarvis", tags=["JARVIS Command Interface"])

class JarvisQuery(BaseModel):
    query: str
    user_id: str = "JWORDEN_MASTER"
    persona: Optional[str] = "JARVIS"

@router.post("/command")
async def jarvis_command(payload: JarvisQuery):
    """
    The direct line to JARVIS from the Command Center.
    Supports persona switching via the 'persona' field.
    """
    context = {"user_id": payload.user_id, "persona": payload.persona}
    response = await jarvis.converse(payload.query, context=context)
    return response

@router.get("/status")
async def jarvis_status():
    """
    Check if JARVIS is online, what brain he's using, and current autonomy state.
    """
    state = autonomy_state.get_state()
    has_brain = bool(os.environ.get("ANTHROPIC_API_KEY", "").strip())
    return {
        "identity":   jarvis.identity,
        "status":     "FROZEN" if state.get("frozen") else jarvis.status,
        "monitoring": jarvis.master_project,
        "engine":     "anthropic-claude" if has_brain else "heuristic-fallback",
        "model":      os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-latest") if has_brain else None,
        "autonomy": {
            "master":   state.get("master"),
            "frozen":   state.get("frozen"),
            "frozenAt": state.get("frozenAt"),
        },
    }

