"""Simple in-memory session store for short-lived owner sessions.

This is intentionally lightweight: stores session_id -> {owner_token, expires_at}.
In production you should back this with Redis or another shared store.
"""
import time
import threading
import uuid
from typing import Optional

_store: dict = {}
_lock = threading.Lock()


def create_session(owner_token: str, ttl: int = 3600) -> dict:
    sid = str(uuid.uuid4())
    expires = int(time.time()) + int(ttl)
    with _lock:
        _store[sid] = {"owner_token": owner_token, "expires_at": expires}
    return {"session_id": sid, "expires_at": expires}


def validate_session(session_id: str) -> Optional[dict]:
    if not session_id:
        return None
    now = int(time.time())
    with _lock:
        data = _store.get(session_id)
        if not data:
            return None
        if data.get("expires_at", 0) < now:
            # expired
            try:
                del _store[session_id]
            except Exception:
                pass
            return None
        return data


def revoke_session(session_id: str) -> bool:
    with _lock:
        if session_id in _store:
            del _store[session_id]
            return True
        return False
