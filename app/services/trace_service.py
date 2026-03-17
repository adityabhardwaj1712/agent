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
