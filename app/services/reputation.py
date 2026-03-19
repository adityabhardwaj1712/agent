import math
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models.agent import Agent
from .event_store import log_event

async def update_reputation(db: AsyncSession, agent_id: str, success: bool, task_id: str):
    stmt = select(Agent).filter(Agent.agent_id == agent_id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()
    
    if not agent:
        return
    
    # 1. Update counters
    agent.total_tasks += 1
    if success:
        agent.successful_tasks += 1
        # Increase reputation: small boost
        agent.reputation_score = min(100.0, agent.reputation_score + 1.5)
    else:
        agent.failed_tasks += 1
        # Decrease reputation: larger penalty (50-year vision: "trust is hard to earn, easy to lose")
        agent.reputation_score = max(0.0, agent.reputation_score - 4.0)
    
    # 2. Log reputation change event
    await log_event(
        db, 
        "ReputationUpdated", 
        agent_id=agent_id, 
        task_id=task_id, 
        payload={
            "new_score": round(agent.reputation_score, 2),
            "success": success
        }
    )
    
    await db.commit()
    return agent.reputation_score

async def decay_all_reputations(db: AsyncSession):
    # Slowly decay all agents toward 50.0 (baseline)
    # This prevents old high scores from lasting forever if agent is inactive
    stmt = select(Agent)
    result = await db.execute(stmt)
    agents = result.scalars().all()
    
    for agent in agents:
        if agent.reputation_score > 50.0:
            agent.reputation_score = max(50.0, agent.reputation_score - 0.1)
        elif agent.reputation_score < 50.0:
            agent.reputation_score = min(50.0, agent.reputation_score + 0.05)
            
    await db.commit()
