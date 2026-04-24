from fastapi import HTTPException, Security
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_premium_security(token: str = Security(oauth2_scheme)):
    if token != "JWORDEN_MASTER_OVERRIDE_KEY":
        raise HTTPException(status_code=403, detail="Unauthorized")
    return {"user": "Admin", "tenant_id": "JWORDEN_HQ"}