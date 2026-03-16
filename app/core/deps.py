from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..core.auth import verify_token
from ..core.scopes import CurrentAgent, has_scopes, parse_scopes
from ..db.database import get_db
from ..models.agent import Agent


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_agent(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> CurrentAgent:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    payload = verify_token(credentials.credentials)
    if not payload or not isinstance(payload, dict):
        raise HTTPException(status_code=401, detail="Invalid token")

    agent_id = payload.get("agent")
    if not agent_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    agent = db.query(Agent).filter(Agent.agent_id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=401, detail="Unknown agent")

    return CurrentAgent(agent_id=agent.agent_id, scopes=parse_scopes(getattr(agent, "scopes", None)))


def require_scopes(required: list[str]):
    def _dep(current: CurrentAgent = Depends(get_current_agent)) -> CurrentAgent:
        if not has_scopes(current, required):
            raise HTTPException(status_code=403, detail="Missing required scopes")
        return current

    return _dep

