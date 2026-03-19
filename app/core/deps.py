from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from ..core.auth_service import verify_token
from ..core.scopes import CurrentAgent, has_scopes, parse_scopes
from ..db.database import get_db
from ..models.agent import Agent
from ..models.user import User
from ..services.api_key_service import api_key_service

bearer_scheme = HTTPBearer(auto_error=False)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    api_key_plain: str | None = Depends(api_key_header),
    db: AsyncSession = Depends(get_db),
) -> User:
    # 1. Try JWT Bearer Token first
    if credentials and credentials.credentials:
        payload = verify_token(credentials.credentials)
        if payload and isinstance(payload, dict):
            user_id = payload.get("user")
            if user_id:
                result = await db.execute(select(User).filter(User.user_id == user_id))
                user = result.scalars().first()
                if user:
                    return user

    # 2. Try API Key if JWT fails or missing
    if api_key_plain:
        api_key_record = await api_key_service.validate_api_key(db, api_key_plain)
        if api_key_record:
            # We return the user, but we might want to attach key-specific context/scopes
            # For now, just fetching the owner
            result = await db.execute(select(User).filter(User.user_id == api_key_record.user_id))
            user = result.scalars().first()
            if user:
                # Optional: inject scopes into the request state or a local context 
                # (handled later in specialized dependencies if needed)
                return user

    raise HTTPException(status_code=401, detail="Invalid authentication (Token or API Key)")

async def get_current_agent(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> CurrentAgent:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    payload = verify_token(credentials.credentials)
    if not payload or not isinstance(payload, dict):
        raise HTTPException(status_code=401, detail="Invalid token")

    agent_id = payload.get("agent")
    if not agent_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    result = await db.execute(select(Agent).filter(Agent.agent_id == agent_id))
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(status_code=401, detail="Unknown agent")

    return CurrentAgent(
        agent_id=agent.agent_id, 
        user_id=agent.owner_id,
        scopes=parse_scopes(getattr(agent, "scopes", None))
    )


def require_scopes(required: list[str]):
    def _dep(current: CurrentAgent = Depends(get_current_agent)) -> CurrentAgent:
        if not has_scopes(current, required):
            raise HTTPException(status_code=403, detail="Missing required scopes")
        return current

    return _dep

