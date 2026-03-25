import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models.agent import Agent
from ..core.auth_service import create_token
from ..core.scopes import parse_scopes
from ..schemas.agent_schema import AgentCreate

# ──────────────────────────────────────────────────────────────────
# BUILT-IN FREE AGENTS (seeded into DB on first call if missing)
# ──────────────────────────────────────────────────────────────────
BUILTIN_AGENTS = [
    {
        "name": "WebResearcher",
        "role": "Research Analyst",
        "description": "Searches the web, summarises findings, and returns structured reports. Uses google_search + web_fetch tools.",
        "personality_config": '{"tone":"professional","style":"concise","emoji":false}',
        "scopes": "READ_MEMORY,WRITE_MEMORY,RUN_TASKS,SEND_PROTOCOL",
    },
    {
        "name": "CodeHelper",
        "role": "Software Engineer",
        "description": "Writes, reviews, and debugs code. Supports Python, TypeScript, and Bash. Uses python_interpreter + shell_execute.",
        "personality_config": '{"tone":"technical","style":"detailed","emoji":false}',
        "scopes": "READ_MEMORY,WRITE_MEMORY,RUN_TASKS,SEND_PROTOCOL",
    },
    {
        "name": "DataAnalyst",
        "role": "Data Scientist",
        "description": "Analyses datasets, generates insights, and creates summary statistics. Uses python_interpreter + calculate tools.",
        "personality_config": '{"tone":"analytical","style":"structured","emoji":false}',
        "scopes": "READ_MEMORY,WRITE_MEMORY,RUN_TASKS,SEND_PROTOCOL",
    },
    {
        "name": "ContentWriter",
        "role": "Content Strategist",
        "description": "Writes blog posts, social copy, and documentation. Optimises for clarity and engagement.",
        "personality_config": '{"tone":"friendly","style":"engaging","emoji":true}',
        "scopes": "READ_MEMORY,WRITE_MEMORY,RUN_TASKS,SEND_PROTOCOL",
    },
    {
        "name": "TaskOrchestrator",
        "role": "Project Manager",
        "description": "Breaks complex goals into sub-tasks, delegates to specialist agents, and aggregates results.",
        "personality_config": '{"tone":"authoritative","style":"structured","emoji":false}',
        "scopes": "READ_MEMORY,WRITE_MEMORY,RUN_TASKS,SEND_PROTOCOL",
    },
    {
        "name": "SecurityGuardian",
        "role": "Security Auditor",
        "description": "Monitors fleet communications for security violations and unsafe payloads. Prevents unauthorized execution.",
        "personality_config": '{"tone":"strict","style":"formal","emoji":false}',
        "scopes": "READ_MEMORY,SEND_PROTOCOL",
    },
    {
        "name": "FleetSummarizer",
        "role": "Data Scientist",
        "description": "Synthesizes long task histories into executive summaries and actionable insights. Ideal for fleet-wide reporting.",
        "personality_config": '{"tone":"analytical","style":"concise","emoji":false}',
        "scopes": "READ_MEMORY,WRITE_MEMORY",
    },
]

from ..models.user import User

async def seed_builtin_agents(db: AsyncSession, owner_id: str):
    """Ensure the built-in agents exist for this owner."""
    
    # Ensure owner exists first to avoid FK constraint violations
    result = await db.execute(select(User).filter(User.user_id == owner_id))
    user = result.scalars().first()
    if not user:
        demo_user = User(
            user_id=owner_id, 
            email=f"{owner_id}@example.com", 
            hashed_password="demo-password-hash"
        )
        db.add(demo_user)
        try:
            await db.commit()
            from loguru import logger
            logger.info(f"Created missing user: {owner_id}")
        except Exception as e:
            await db.rollback()
            from loguru import logger
            logger.error(f"Failed to create missing user {owner_id}: {e}")
            

    """Ensure the built-in agents exist for this owner."""
    for spec in BUILTIN_AGENTS:
        result = await db.execute(
            select(Agent).filter(
                Agent.name == spec["name"],
                Agent.owner_id == owner_id
            )
        )
        existing = result.scalars().first()
        if existing:
            continue
        agent = Agent(
            agent_id=str(uuid.uuid4()),
            name=spec["name"],
            role=spec["role"],
            description=spec["description"],
            owner_id=owner_id,
            scopes=spec["scopes"],
            personality_config=spec["personality_config"],
            reputation_score=75.0,
            total_tasks=0,
            successful_tasks=0,
            failed_tasks=0,
        )
        db.add(agent)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        from loguru import logger
        logger.error(f"Failed to seed builtin agents: {e}")

async def register_agent(db: AsyncSession, data: AgentCreate):
    # Ensure owner exists to avoid FK constraint violations
    result = await db.execute(select(User).filter(User.user_id == data.owner_id))
    user = result.scalars().first()
    if not user:
        new_user = User(
            user_id=data.owner_id,
            email=f"{data.owner_id}@example.com",
            hashed_password="auto-provisioned"
        )
        db.add(new_user)
        await db.flush() # Flush to ensure user_id is available for FK

    agent_id = str(uuid.uuid4())
    scopes_str = ",".join(data.scopes) if data.scopes else "READ_MEMORY,WRITE_MEMORY,RUN_TASKS,SEND_PROTOCOL"
    db_agent = Agent(
        agent_id=agent_id,
        name=data.name,
        role=data.role,
        description=data.description,
        personality_config=data.personality_config,
        owner_id=data.owner_id,
        scopes=scopes_str,
        model_name=data.model_name,
        base_cost=data.base_cost,
    )
    db.add(db_agent)
    try:
        await db.commit()
        await db.refresh(db_agent)
    except Exception as e:
        await db.rollback()
        raise e

    scopes = sorted(list(parse_scopes(getattr(db_agent, "scopes", None))))
    token = create_token(agent_id, scopes=scopes)

    return {
        "agent_id": agent_id,
        "name": db_agent.name,
        "role": db_agent.role,
        "description": db_agent.description,
        "personality_config": db_agent.personality_config,
        "owner_id": db_agent.owner_id,
        "scopes": scopes,
        "reputation_score": db_agent.reputation_score,
        "total_tasks": db_agent.total_tasks,
        "successful_tasks": db_agent.successful_tasks,
        "failed_tasks": db_agent.failed_tasks,
        "token": token,
    }


async def get_agent(db: AsyncSession, agent_id: str, owner_id: str | None = None):
    """Fetch an agent by ID. Optionally scope to owner."""
    query = select(Agent).filter(Agent.agent_id == agent_id)
    if owner_id:
        query = query.filter(Agent.owner_id == owner_id)
    result = await db.execute(query)
    return result.scalars().first()


async def list_agents(db: AsyncSession, owner_id: str | None = None, skip: int = 0, limit: int = 100):
    """List agents with pagination, optionally filtered by owner."""
    query = select(Agent)
    if owner_id:
        query = query.filter(Agent.owner_id == owner_id)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def delete_agent(db: AsyncSession, agent_id: str, owner_id: str | None = None):
    agent = await get_agent(db, agent_id, owner_id)
    if agent:
        await db.delete(agent)
        await db.commit()
        return True
    return False


async def update_agent(db: AsyncSession, agent_id: str, owner_id: str, updates: dict):
    agent = await get_agent(db, agent_id, owner_id)
    if not agent:
        return None
    for key, value in updates.items():
        if hasattr(agent, key) and value is not None:
            setattr(agent, key, value)
    await db.commit()
    await db.refresh(agent)
    return agent
