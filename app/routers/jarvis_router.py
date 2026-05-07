from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
import os
from app.services.jarvis import jarvis
from app.services import autonomy_state
from app.services import web_search as _web_search
from app.services import vapi_caller as _vapi
from app.services import email_service as _email
from app.services import runtime_config as _cfg
import asyncio
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/jarvis", tags=["JARVIS Command Interface"])

class JarvisQuery(BaseModel):
    query:     str
    user_id:   str = "JWORDEN_MASTER"
    persona:   Optional[str] = "JARVIS"
    confirmed: bool = Field(False, description="Operator confirmed this action — allows tool calls when master autonomy is OFF.")

class WebSearchRequest(BaseModel):
    query: str
    deep:  bool = False

class CallRequest(BaseModel):
    to_number:   str
    purpose:     str
    script_hint: Optional[str] = None
    confirmed:   bool = True   # direct REST call always counts as operator confirmation

class EmailRequest(BaseModel):
    to_email: Optional[str] = None
    subject:  str
    body:     str

@router.post("/command")
async def jarvis_command(payload: JarvisQuery):
    """
    The direct line to JARVIS from the Command Center.
    Supports persona switching via the 'persona' field and tool use (web search, phone calls).
    """
    context = {
        "user_id":   payload.user_id,
        "persona":   payload.persona,
        "confirmed": payload.confirmed,
    }
    response = await jarvis.converse(payload.query, context=context)
    return response

@router.post("/search", summary="Direct web search (Tavily) — bypasses Claude")
async def jarvis_search(req: WebSearchRequest):
    return await _web_search.search(req.query, deep=req.deep)

@router.post("/call", summary="Direct outbound call (Vapi) — operator-initiated")
async def jarvis_call(req: CallRequest):
    """
    Operator-initiated outbound call. Requires Vapi configured.
    Refused when autonomy is FROZEN. Logs every attempt.
    """
    result = await _vapi.place_call(
        req.to_number,
        purpose=req.purpose,
        script_hint=req.script_hint,
        confirmed=req.confirmed,
    )
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error") or "Call failed")
    return result

@router.post("/email", summary="Direct email send (SendGrid) — operator-initiated")
async def jarvis_email(req: EmailRequest):
    to_addr = (req.to_email or os.environ.get("ADMIN_NOTIFY_EMAIL") or "j.wordenandsonspaving@gmail.com").strip()
    safe = (req.body or "").replace("&", "&amp;").replace("<", "&lt;")
    html = f"<pre style='font-family:ui-monospace,Consolas,monospace;white-space:pre-wrap'>{safe}</pre>"
    ok = await asyncio.to_thread(
        _email.send_raw,
        to_email=to_addr, subject=req.subject, html_body=html, plain_text=req.body,
    )
    if not ok:
        raise HTTPException(status_code=400, detail="Email send failed (check SENDGRID_API_KEY + SENDGRID_FROM_EMAIL on Railway)")
    return {"ok": True, "to": to_addr, "subject": req.subject}

@router.get("/status")
async def jarvis_status():
    """
    Check if JARVIS is online, what brain he's using, what tools are configured,
    and the current autonomy state.
    """
    state = autonomy_state.get_state()
    has_brain = bool(_cfg.get("ANTHROPIC_API_KEY").strip())
    has_email = bool(_cfg.get("SENDGRID_API_KEY").strip() and _cfg.get("SENDGRID_FROM_EMAIL").strip())
    return {
        "identity":   jarvis.identity,
        "status":     "FROZEN" if state.get("frozen") else jarvis.status,
        "monitoring": jarvis.master_project,
        "engine":     "anthropic-claude" if has_brain else "heuristic-fallback",
        "model":      (_cfg.get("ANTHROPIC_MODEL") or "claude-sonnet-4-5") if has_brain else None,
        "tools": {
            "web_search":       _web_search.is_available(),
            "make_phone_call":  _vapi.is_available(),
            "send_email":       has_email,
        },
        "autonomy": {
            "master":   state.get("master"),
            "frozen":   state.get("frozen"),
            "frozenAt": state.get("frozenAt"),
        },
    }

