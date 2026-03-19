import jwt
import datetime
import os
print(f"DEBUG: Importing app.core.auth from {__file__}")
from ..config import settings

# Lazy load keys to avoid failure during initial setup/migration
_PRIVATE_KEY = None
_PUBLIC_KEY = None

def _read_key(path: str):
    if not os.path.exists(path):
        raise FileNotFoundError(f"JWT Key not found: {path}")
    with open(path, "r") as f:
        return f.read()

def get_private_key():
    global _PRIVATE_KEY
    if _PRIVATE_KEY is None:
        _PRIVATE_KEY = _read_key(settings.JWT_PRIVATE_KEY_PATH)
    return _PRIVATE_KEY

def get_public_key():
    global _PUBLIC_KEY
    if _PUBLIC_KEY is None:
        _PUBLIC_KEY = _read_key(settings.JWT_PUBLIC_KEY_PATH)
    return _PUBLIC_KEY

def create_token(agent_id: str, scopes: list[str] | None = None):
    payload = {
        "agent": agent_id,
        "scopes": scopes or [],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    return jwt.encode(
        payload,
        get_private_key(),
        algorithm=settings.JWT_ALGORITHM
    )

def create_user_token(user_id: str):
    payload = {
        "user": user_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    return jwt.encode(
        payload,
        get_private_key(),
        algorithm=settings.JWT_ALGORITHM
    )

def verify_token(token: str):
    try:
        payload = jwt.decode(token, get_public_key(), algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
