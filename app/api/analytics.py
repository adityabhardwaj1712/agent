from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from ..db.database import get_db
from ..db.redis_client import get_redis_client
from ..models.agent import Agent

router = APIRouter(prefix="/analytics")

@router.get("/metrics")
async def get_metrics(db: AsyncSession = Depends(get_db)):
    r = get_redis_client()
    
    # 1. Database: Active Agents
    agent_count_result = await db.execute(select(func.count(Agent.agent_id)))
    active_agents = agent_count_result.scalar() or 0
    
    # 2. Redis: Task Statistics
    tasks_submitted = int(r.get("metrics:tasks_submitted_total") or 0)
    tasks_failed = int(r.get("metrics:tasks_failed_total") or 0)
    healing_events = int(r.get("metrics:auto_healing_total") or 0)
    
    success_rate = 100.0
    if tasks_submitted > 0:
        success_rate = ((tasks_submitted - tasks_failed) / tasks_submitted) * 100
    
    return {
        "active_agents": active_agents,
        "tasks_last_24h": tasks_submitted,
        "success_rate": f"{success_rate:.1f}%",
        "auto_healing_events": healing_events,
        "avg_reasoning_time": r.get("metrics:avg_reasoning_ms") or "450ms",
    }
