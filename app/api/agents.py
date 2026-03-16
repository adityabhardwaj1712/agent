from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..core.audit import log_audit
from ..services.agent_service import register_agent
from ..schemas.agent_schema import AgentCreate, AgentResponse

router = APIRouter(prefix="/agents")

@router.post("/register", response_model=AgentResponse)
def create_agent(request: Request, data: AgentCreate, db: Session = Depends(get_db)):
    result = register_agent(db, data)
    log_audit(
        db,
        request=request,
        agent_id=result.get("agent_id"),
        action="agents.register",
        status_code=200,
    )
    return result
