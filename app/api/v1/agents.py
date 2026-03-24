from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from ...db.database import get_db
from ...services import agent_service
from ...schemas.agent_schema import AgentCreate, AgentResponse

router = APIRouter()

@router.get("/", response_model=List[AgentResponse])
async def get_agents(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db)
):
    # Auto-seed for demo purposes if empty
    agents = await agent_service.list_agents(db, skip=skip, limit=limit)
    if not agents and skip == 0:
        await agent_service.seed_builtin_agents(db, owner_id="demo-user")
        agents = await agent_service.list_agents(db, skip=skip, limit=limit)
    return agents

@router.post("/", response_model=AgentResponse)
async def create_agent(
    agent: AgentCreate, 
    db: AsyncSession = Depends(get_db)
):
    return await agent_service.register_agent(db, agent)
