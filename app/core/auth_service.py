import jwt
import datetime
from ..config import settings

def create_token(agent_id: str, scopes: list[str] | None = None):
    payload = {
        "sub": agent_id,
        "type": "access",
        "scopes": scopes or [],
        "exp": datetime.datetime.now(datetime.UTC) + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    return jwt.encode(
        payload,
        settings.private_key,
        algorithm=settings.JWT_ALGORITHM
    )

def create_user_token(user_id: str):
    payload = {
        "sub": user_id,
        "type": "access",
        "exp": datetime.datetime.now(datetime.UTC) + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    return jwt.encode(
        payload,
        settings.private_key,
        algorithm=settings.JWT_ALGORITHM
    )

def create_refresh_token(user_id: str):
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    }
    return jwt.encode(
        payload,
        settings.private_key,
        algorithm=settings.JWT_ALGORITHM
    )

def verify_token(token: str):
    try:
        payload = jwt.decode(token, settings.public_key, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
