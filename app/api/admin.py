from fastapi import APIRouter, Depends
from ..core.deps import get_current_user
from ..models.user import User
from ..services.circuit_breaker import circuit_breaker, CircuitState, replay_dlq, DLQ_STREAM

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/circuits")
async def list_circuits(current_user: User = Depends(get_current_user)):
    return await circuit_breaker.get_all_circuit_stats()

@router.post("/circuits/{agent_id}/reset")
async def reset_circuit(agent_id: str, current_user: User = Depends(get_current_user)):
    await circuit_breaker.force_state(agent_id, CircuitState.CLOSED)
    return {"agent_id": agent_id, "state": "closed"}

@router.post("/circuits/{agent_id}/open")
async def open_circuit(agent_id: str, current_user: User = Depends(get_current_user)):
    await circuit_breaker.force_state(agent_id, CircuitState.OPEN)
    return {"agent_id": agent_id, "state": "open"}

@router.get("/dlq")
async def view_dlq(current_user: User = Depends(get_current_user)):
    from ..db.redis_client import get_async_redis_client
    redis = await get_async_redis_client()
    entries = await redis.xrange(DLQ_STREAM, count=50)
    return [{"entry_id": eid, **data} for eid, data in entries]

@router.post("/dlq/replay")
async def replay(limit: int = 10, current_user: User = Depends(get_current_user)):
    replayed = await replay_dlq(limit)
    return {"replayed_count": len(replayed), "task_ids": replayed}
