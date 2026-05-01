import os
from fastapi import HTTPException, Security
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

_ALGORITHM = "HS256"


def verify_premium_security(token: str = Security(oauth2_scheme)):
    """
    Verify a bearer token using either:
      1. A long-lived master API key stored in JWORDEN_MASTER_KEY env var, or
      2. A JWT signed with JWT_SECRET_KEY env var.

    Neither key is hard-coded; both must be supplied at runtime.
    """
    if token is None:
        raise HTTPException(status_code=403, detail="Unauthorized: no token")

    # Master key path (simple API key, no expiry — suitable for internal tools)
    master_key = os.getenv("JWORDEN_MASTER_KEY", "")
    if master_key and token == master_key:
        return {"user": "Admin", "tenant_id": "JWORDEN_HQ"}

    # JWT path
    secret = os.getenv("JWT_SECRET_KEY", "")
    if not secret:
        raise HTTPException(
            status_code=500,
            detail="Server authentication is not configured. Set JWT_SECRET_KEY.",
        )
    try:
        payload = jwt.decode(token, secret, algorithms=[_ALGORITHM])
        return {
            "user": payload.get("sub", "unknown"),
            "tenant_id": payload.get("tenant_id", "JWORDEN_HQ"),
        }
    except JWTError:
        raise HTTPException(status_code=403, detail="Unauthorized: invalid token")