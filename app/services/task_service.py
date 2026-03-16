from ..schemas.task_schema import TaskCreate
from .orchestrator import orchestrator
from ..db.redis_client import get_redis_client


def send_task(data: TaskCreate):
    enq = orchestrator.enqueue_task(data.payload)

    # Increment simple usage counters in Redis
    r = get_redis_client()
    r.incr("metrics:tasks_submitted_total")
    if data.agent_id:
        r.incr(f"metrics:tasks_submitted_by_agent:{data.agent_id}")

    return {
        "task_id": enq.task_id,
        "agent_id": data.agent_id,
        "payload": data.payload,
        "status": "queued",
    }


def get_task_status(task_id: str):
    status = orchestrator.get_status(task_id)
    return {"task_id": status.task_id, "status": status.status, "result": status.result}
