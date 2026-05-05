from typing import List, Optional, Dict, Any, Union
import uuid
import yaml
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from loguru import logger

from ..models.agent import Agent
from ..models.user import User
from ..core.auth_service import create_token
from ..core.scopes import parse_scopes
from ..schemas.agent_schema import AgentCreate
from ..core.roster import AGENT_ROSTER

# ------------------------------------------------------------------
# BUILT-IN FREE AGENTS
# ------------------------------------------------------------------
def load_agent_templates() -> List[Dict[str, Any]]:
    """
    Loads agent templates from the static YAML catalog.
    """
    template_path = os.path.join(os.path.dirname(__file__), "..", "data", "agent_templates.yaml")
    try:
        with open(template_path, "r") as f:
            return yaml.safe_load(f) or []
    except Exception as e:
        logger.error(f"Failed to load agent templates: {e}")
        return []

BUILTIN_AGENTS = load_agent_templates()

async def seed_system_agents(db: AsyncSession, owner_id: str) -> None:
    """
    Seeds the core system agent roster for a specific owner.
    
    Ensures that the primary tactical agents are available in the registry
    for immediate mission dispatch.
    
    Args:
        db (AsyncSession): The database session.
        owner_id (str): Unique identifier of the agent owner.
    """
    result = await db.execute(select(User).filter(User.user_id == owner_id))
    user = result.scalars().first()
    
    if not user:
        logger.info(f"Auto-provisioning system user: {owner_id}")
        demo_user = User(
            user_id=owner_id, 
            email=f"{owner_id}@agentcloud.internal", 
            hashed_password="internal-provisioned"
        )
        db.add(demo_user)
        try:
            await db.commit()
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to provision system user {owner_id}: {e}")
            return

    for data in AGENT_ROSTER:
        res = await db.execute(
            select(Agent).filter(
                Agent.name == data["name"],
                Agent.owner_id == owner_id
            )
        )
        if not res.scalars().first():
            db.add(Agent(
                agent_id=str(uuid.uuid4()),
                name=data['name'],
                role=data['role'],
                description=data['desc'],
                owner_id=owner_id,
                model_name=data.get('model', 'gpt-4o')
            ))
    
    try:
        await db.commit()
        logger.info(f"Tactical Registry Provisioned for: {owner_id}")
    except Exception as e:
        await db.rollback()
        logger.error(f"Registry provisioning failed for {owner_id}: {e}")

async def register_agent(db: AsyncSession, data: AgentCreate) -> Dict[str, Any]:
    """
    Registers a new autonomous agent into the platform registry.
    
    Args:
        db (AsyncSession): Database session.
        data (AgentCreate): Validated agent creation schema.
        
    Returns:
        Dict[str, Any]: A dictionary containing the new agent metadata and access token.
    """
    result = await db.execute(select(User).filter(User.user_id == data.owner_id))
    if not result.scalars().first():
        new_user = User(
            user_id=data.owner_id,
            email=f"{data.owner_id}@agentcloud.internal",
            hashed_password="auto-provisioned"
        )
        db.add(new_user)
        await db.flush()

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
        logger.error(f"Agent registration failed: {e}")
        raise

    scopes = sorted(list(parse_scopes(getattr(db_agent, "scopes", None))))
    token = create_token(agent_id, scopes=scopes)

    return {
        "agent_id": agent_id,
        "name": db_agent.name,
        "role": db_agent.role,
        "token": token,
        "scopes": scopes
    }

async def get_agent(db: AsyncSession, agent_id: str, owner_id: Optional[str] = None) -> Optional[Agent]:
    """
    Retrieves an agent from the registry by its unique identifier.
    
    Args:
        db (AsyncSession): Database session.
        agent_id (str): The agent's UUID.
        owner_id (Optional[str]): Scopes the lookup to a specific owner if provided.
        
    Returns:
        Optional[Agent]: The agent record if found, else None.
    """
    query = select(Agent).filter(Agent.agent_id == agent_id)
    if owner_id:
        query = query.filter(Agent.owner_id == owner_id)
    result = await db.execute(query)
    return result.scalars().first()

async def list_agents(db: AsyncSession, owner_id: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Agent]:
    """
    Lists registered agents with pagination support.
    
    Args:
        db (AsyncSession): Database session.
        owner_id (Optional[str]): Filters the list to a specific owner.
        skip (int): Offset for pagination.
        limit (int): Maximum records to return.
        
    Returns:
        List[Agent]: A list of agent records.
    """
    query = select(Agent)
    if owner_id:
        query = query.filter(Agent.owner_id == owner_id)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def delete_agent(db: AsyncSession, agent_id: str, owner_id: Optional[str] = None) -> bool:
    """
    Performs a hard deletion of an agent from the registry.
    
    Args:
        db (AsyncSession): Database session.
        agent_id (str): The agent's UUID.
        owner_id (Optional[str]): Authorization check against owner.
        
    Returns:
        bool: True if deleted, False if not found/unauthorized.
    """
    agent = await get_agent(db, agent_id, owner_id)
    if agent:
        await db.delete(agent)
        try:
            await db.commit()
            return True
        except Exception as e:
            await db.rollback()
            logger.error(f"Agent deletion failed for {agent_id}: {e}")
    return False

async def update_agent(db: AsyncSession, agent_id: str, owner_id: str, updates: Dict[str, Any]) -> Optional[Agent]:
    """
    Updates existing agent attributes.
    
    Args:
        db (AsyncSession): Database session.
        agent_id (str): The agent's UUID.
        owner_id (str): Authorization check.
        updates (Dict[str, Any]): Dictionary of attributes to update.
        
    Returns:
        Optional[Agent]: The updated agent record.
    """
    agent = await get_agent(db, agent_id, owner_id)
    if not agent:
        return None
    for key, value in updates.items():
        if hasattr(agent, key) and value is not None:
            setattr(agent, key, value)
    try:
        await db.commit()
        await db.refresh(agent)
        return agent
    except Exception as e:
        await db.rollback()
        logger.error(f"Agent update failed for {agent_id}: {e}")
        return None

async def get_leaderboard(db: AsyncSession, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Returns the top-performing agents sorted by total task volume.
    
    Args:
        db (AsyncSession): Database session.
        limit (int): Number of records to return.
        
    Returns:
        List[Dict[str, Any]]: List of success/volume metrics per agent.
    """
    from sqlalchemy import desc
    query = select(Agent).order_by(desc(Agent.total_tasks)).limit(limit)
    result = await db.execute(query)
    agents = result.scalars().all()
    
    return [
        {
            "name": a.name,
            "success_rate": (a.successful_tasks / a.total_tasks) if a.total_tasks > 0 else 0.0,
            "tasks_completed": a.total_tasks
        } for a in agents
    ]

async def suggest_agent_improvements(agent_id: str, history: List[Dict[str, Any]]) -> str:
    """
    Enterprise Replacement for Auto-Optimizer.
    Instead of auto-mutating, it returns a suggested prompt for human review.
    """
    from app.services.model_router import select_model, call_provider
    import json
    
    prompt = f"Review the performance of agent {agent_id} based on these recent tasks: {json.dumps(history)}\nSuggest a more effective prompt that would improve success rates and clarity."
    system = "You are an expert Prompt Engineer. Provide a single, improved prompt text without any preamble or markdown."
    
    choice = select_model("optimization")
    content, _, _ = await call_provider(choice=choice, prompt=prompt, context=system)
    return content.strip()

