from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import os
from ..services import session_store
from ..database import get_db
from ..services.audit import write_audit_event

router = APIRouter(prefix="/api/v1/admin/owner", tags=["admin", "owner"])


class UnlockRequest(BaseModel):
    owner_token: str
    pin: str | None = None


@router.post("/unlock")
def unlock_owner_session(req: UnlockRequest, db=Depends(get_db)):
    allowed = os.environ.get("OWNER_TOKENS", os.environ.get("OWNER_TOKEN", "")).split(",")
    allowed = [t.strip() for t in allowed if t and t.strip()]
    if req.owner_token.strip() not in allowed:
        raise HTTPException(status_code=403, detail="Invalid owner token")

    # create short-lived server session
    sess = session_store.create_session(req.owner_token.strip(), ttl=int(os.getenv('OWNER_SESSION_TTL', '3600')))

    # audit
    try:
        write_audit_event(db, event_type='owner_session', summary='Owner session created', actor_type='owner', actor_id=req.owner_token[:8], detail={'session_id': sess['session_id']})
    except Exception:
        pass

    return {"ok": True, "session_id": sess['session_id'], "expires_at": sess['expires_at']}


@router.post("/revoke")
def revoke_owner_session(session_id: str):
    ok = session_store.revoke_session(session_id)
    return {"ok": ok}
