from sqlalchemy.ext.asyncio import AsyncSession
from ..schemas.task_schema import TaskCreate
from .orchestrator import orchestrator
from ..db.redis_client import get_redis_client
from ..models.task import Task
import uuid
import json

async def send_task(db: AsyncSession, data: TaskCreate):
    task_id = str(uuid.uuid4())
    
    # 1. Create task record in DB immediately
    task = Task(
        task_id=task_id,
        agent_id=data.agent_id,
        goal_id=data.goal_id,
        parent_task_id=data.parent_task_id,
        payload=data.payload,
        status="queued"
    )
    db.add(task)
    await db.commit()

    # 2. Enqueue for the async worker
    r = get_redis_client()
    task_payload = {
        "task_id": task_id,
        "agent_id": data.agent_id,
        "goal_id": data.goal_id,
        "parent_task_id": data.parent_task_id,
        "payload": data.payload
    }
    r.lpush("agent_tasks", json.dumps(task_payload))
    
    # Increment simple usage counters in Redis
    r.incr("metrics:tasks_submitted_total")
    if data.agent_id:
        r.incr(f"metrics:tasks_submitted_by_agent:{data.agent_id}")

    return {
        "task_id": task_id,
        "agent_id": data.agent_id,
        "payload": data.payload,
        "status": "queued",
    }


async def get_task_status(db: AsyncSession, task_id: str):
    # Check Postgres first - it's our source of truth now
    task = await db.get(Task, task_id)
    if task:
        return {
            "task_id": task.task_id,
            "status": task.status,
            "result": task.result,
            "agent_id": task.agent_id,
            "goal_id": task.goal_id,
            "thought_process": task.thought_process
        }
    
    # Fallback to orchestrator/celery (legacy support)
    status = orchestrator.get_status(task_id)
    return {"task_id": status.task_id, "status": status.status, "result": status.result}
