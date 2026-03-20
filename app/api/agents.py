from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..db.database import get_db
from ..core.deps import get_current_user
from ..core.audit import log_audit
from ..services.agent_service import register_agent, get_agent, list_agents, delete_agent
from ..schemas.agent_schema import AgentCreate, AgentResponse
from ..models.user import User

router = APIRouter(prefix="/agents")

@router.post("/register", response_model=AgentResponse)
async def create_agent(
    request: Request,
    data: AgentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Enforce that the owner_id matches the authenticated user
    data.owner_id = user.user_id
    result = await register_agent(db, data)
    await log_audit(
        db,
        request=request,
        agent_id=result.get("agent_id"),
        action="agents.register",
        status_code=200,
    )
    return result

@router.get("/", response_model=List[AgentResponse])
async def list_all(owner_id: str | None = None, db: AsyncSession = Depends(get_db)):
    return await list_agents(db, owner_id)

@router.get("/leaderboard", response_model=List[AgentResponse])
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    from ..models.agent import Agent
    from sqlalchemy.future import select
    stmt = select(Agent).order_by(Agent.reputation_score.desc()).limit(10)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{agent_id}", response_model=AgentResponse)
async def get(agent_id: str, db: AsyncSession = Depends(get_db)):
    agent = await get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.delete("/{agent_id}")
async def delete(agent_id: str, db: AsyncSession = Depends(get_db)):
    success = await delete_agent(db, agent_id)
    if not success:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"status": "deleted"}
