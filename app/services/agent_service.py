import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models.agent import Agent
from ..core.auth import create_token
from ..core.scopes import parse_scopes
from ..schemas.agent_schema import AgentCreate

async def register_agent(db: AsyncSession, data: AgentCreate):
    agent_id = str(uuid.uuid4())
    db_agent = Agent(
        agent_id=agent_id,
        name=data.name,
        role=data.role,
        description=data.description,
        owner_id=data.owner_id
    )
    db.add(db_agent)
    await db.commit()
    await db.refresh(db_agent)
    
    scopes = sorted(list(parse_scopes(getattr(db_agent, "scopes", None))))
    token = create_token(agent_id, scopes=scopes)
    
    return {
        "agent_id": agent_id,
        "name": db_agent.name,
        "owner_id": db_agent.owner_id,
        "scopes": scopes,
        "token": token,
    }

async def get_agent(db: AsyncSession, agent_id: str, owner_id: str):
    result = await db.execute(
        select(Agent).filter(Agent.agent_id == agent_id, Agent.owner_id == owner_id)
    )
    return result.scalars().first()

async def list_agents(db: AsyncSession, owner_id: str):
    query = select(Agent).filter(Agent.owner_id == owner_id)
    result = await db.execute(query)
    return result.scalars().all()

async def delete_agent(db: AsyncSession, agent_id: str, owner_id: str):
    agent = await get_agent(db, agent_id, owner_id)
    if agent:
        await db.delete(agent)
        await db.commit()
        return True
    return False
