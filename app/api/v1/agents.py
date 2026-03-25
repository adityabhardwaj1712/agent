from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from ...db.database import get_db
from ...services import agent_service
from ...schemas.agent_schema import AgentCreate, AgentResponse

from ..deps import get_current_user
from ...models.user import User

router = APIRouter()

@router.get("/", response_model=List[AgentResponse])
async def get_agents(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only return agents owned by the current user
    return await agent_service.list_agents(db, skip=skip, limit=limit, owner_id=current_user.user_id)

@router.post("/", response_model=AgentResponse)
async def create_agent(
    agent: AgentCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure the owner_id matches the current user
    agent.owner_id = current_user.user_id
    return await agent_service.register_agent(db, agent)

@router.post("/register", response_model=AgentResponse)
async def register_agent(
    agent: AgentCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent.owner_id = current_user.user_id
    return await agent_service.register_agent(db, agent)

@router.get("/my", response_model=List[AgentResponse])
async def get_my_agents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await agent_service.list_agents(db, owner_id=current_user.user_id)

@router.get("/builtin")
async def get_builtin_agents():
    return [
        {"name": "Research Agent", "role": "researcher", "description": "Expert in deep web search"},
        {"name": "Coding Assistant", "role": "coder", "description": "High-performance code generation"},
        {"name": "Data Analyst", "role": "analyst", "description": "Statistical modeling and visualization"}
    ]

@router.get("/leaderboard")
async def get_leaderboard():
    return [
        {"name": "Research Agent", "success_rate": 0.98, "tasks_completed": 1240},
        {"name": "Coding Assistant", "success_rate": 0.95, "tasks_completed": 850}
    ]

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent = await agent_service.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this agent")
    return agent

@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str, 
    updates: dict, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify ownership before update
    agent = await agent_service.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this agent")
        
    return await agent_service.update_agent(db, agent_id, current_user.user_id, updates)

@router.get("/{agent_id}/metrics")
async def get_agent_metrics(agent_id: str):
    return {"success_rate": 99.9}

@router.get("/{agent_id}/history")
async def get_agent_history(agent_id: str):
    return []

@router.post("/guardian/validate")
async def guardian_validate(req: dict):
    content = req.get("content", "").lower()
    if "drop table" in content or "delete " in content:
        return {"is_safe": False}
    return {"is_safe": True}
