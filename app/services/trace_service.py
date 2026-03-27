from sqlalchemy.ext.asyncio import AsyncSession
from ..models.trace import Trace
import json

async def log_trace(
    db: AsyncSession,
    task_id: str,
    agent_id: str,
    step: str,
    input_data: dict | None = None,
    output_data: dict | None = None,
    metadata: dict | None = None
):
    """
    AXON Observability: Logs a detailed trace of a single processing step.
    """
    trace = Trace(
        task_id=task_id,
        agent_id=agent_id,
        step=step,
        input_data=input_data,
        output_data=output_data,
        metadata_info=metadata
    )
    db.add(trace)
    await db.commit()
    
    # Also publish to Redis for real-time UI updates (ACP Visualization)
    from ..db.redis_client import get_redis_client
    r = get_redis_client()
    event = {
        "task_id": task_id,
        "agent_id": agent_id,
        "step": step,
        "timestamp": str(trace.created_at)
    }
    r.publish(f"agent:{agent_id}:traces", json.dumps(event))
async def get_trace_analytics(db: AsyncSession, agent_id: str | None = None, limit: int = 100):
    """
    AXON Analytics: Calculates average tool/step latency from recent traces.
    """
    from sqlalchemy import select, func
    from ..models.trace import Trace
    
    query = select(Trace.step, func.avg(func.extract('epoch', Trace.created_at))).group_by(Trace.step)
    if agent_id:
        query = query.filter(Trace.agent_id == agent_id)
    
    # In a real scenario, we'd need a 'duration' column. 
    # For now, we'll return recent trace counts per step as a proxy for 'Fleet Pulse'.
    query = select(Trace.step, func.count(Trace.trace_id)).group_by(Trace.step).order_by(func.count(Trace.trace_id).desc()).limit(limit)
    
    result = await db.execute(query)
    return {row[0]: row[1] for row in result.all()}

async def get_traces_for_task(db: AsyncSession, task_id: str, limit: int = 5):
    """
    Fetch the latest execution traces for a given task ID. Used by Root Cause Analysis.
    """
    from sqlalchemy import select
    from ..models.trace import Trace
    
    query = select(Trace).filter(Trace.task_id == task_id).order_by(Trace.created_at.desc()).limit(limit)
    res = await db.execute(query)
    return res.scalars().all()
