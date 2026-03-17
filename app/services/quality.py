from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models.event import Event
from ..models.agent import Agent
from ..db.redis_client import get_redis_client
import time

async def score_output(db: AsyncSession, agent_id: str, task_id: str, output: str):
    # Simplified scoring based on basic heuristics for now
    # In a real system, this would call an LLM judge (Braintrust style)
    score = 1.0
    if len(output) < 10:
        score -= 0.5
    if "error" in output.lower():
        score -= 0.8
    
    # Store score in Redis for quick access/circuit breaking
    r = get_redis_client()
    key = f"agent_quality:{agent_id}"
    r.lpush(key, score)
    r.ltrim(key, 0, 99) # Keep last 100 scores
    
    # Circuit breaker check: if last 3 scores are very low, flag it
    recent_scores = [float(s) for s in r.lrange(key, 0, 2)]
    if len(recent_scores) == 3 and all(s < 0.3 for s in recent_scores):
        print(f"!!! CIRCUIT BREAKER TRIGGERED for agent {agent_id}")
        r.set(f"agent_status:{agent_id}", "paused")
    
    return score

async def get_agent_health(agent_id: str):
    r = get_redis_client()
    key = f"agent_quality:{agent_id}"
    scores = [float(s) for s in r.lrange(key, 0, -1)]
    avg_score = float(sum(scores)) / len(scores) if scores else 1.0
    status = r.get(f"agent_status:{agent_id}") or "active"
    
    return {
        "avg_quality_score": round(avg_score, 2),
        "status": str(status),
        "recent_performance": scores[-10:] if len(scores) >= 10 else scores
    }
