from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.services.jarvis import jarvis
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
    Check if JARVIS is online and monitoring JWORDENAI.
    """
    return {
        "identity": jarvis.identity,
        "status": jarvis.status,
        "monitoring": jarvis.master_project
    }
