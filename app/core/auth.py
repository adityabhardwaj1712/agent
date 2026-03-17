import jwt
import datetime
import os
from ..config import settings

# Load keys
def _read_key(path: str):
    if not os.path.exists(path):
        raise FileNotFoundError(f"JWT Key not found: {path}")
    with open(path, "r") as f:
        return f.read()

PRIVATE_KEY = _read_key(settings.JWT_PRIVATE_KEY_PATH)
PUBLIC_KEY = _read_key(settings.JWT_PUBLIC_KEY_PATH)

def create_token(agent_id: str, scopes: list[str] | None = None):
    payload = {
        "agent": agent_id,
        "scopes": scopes or [],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    return jwt.encode(
        payload,
        PRIVATE_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

def verify_token(token: str):
    try:
        payload = jwt.decode(token, PUBLIC_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
