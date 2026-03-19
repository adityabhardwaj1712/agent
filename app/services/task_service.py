from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import json
from ..models.task import Task
from ..models.agent import Agent
from ..schemas.task_schema import TaskCreate
from .billing_service import billing_service
from .orchestrator import orchestrator, Priority

async def send_task(db: AsyncSession, data: TaskCreate, user_id: str):
    task_id = str(uuid.uuid4())
    
    # 1. Check Limits (e.g., tasks per month)
    if not await billing_service.check_limits(db, user_id, "tasks_per_month"):
        raise PermissionError("Plan task limit reached")

    # 3. Enqueue for the async worker (Power-up 5: Priority Queue)
    priority = Priority.NORMAL
    if "urgent" in (data.payload or "").lower():
        priority = Priority.CRITICAL
    
    await orchestrator.enqueue_task(
        db=db,
        payload=data.payload,
        user_id=user_id,
        agent_id=data.agent_id,
        priority=priority,
        goal_id=data.goal_id,
        parent_task_id=data.parent_task_id
    )
    
    # 4. Record Usage
    await billing_service.record_usage(user_id, "tasks")
    
    # Fetch task for response (orchestrator created it)
    from sqlalchemy import select
    res = await db.execute(select(Task).where(Task.user_id == user_id).order_by(Task.created_at.desc()))
    task = res.scalars().first()
    return task


async def get_task_status(db: AsyncSession, task_id: str, user_id: str):
    # Check Postgres first - filter by user_id
    query = select(Task).where(Task.task_id == task_id, Task.user_id == user_id)
    result = await db.execute(query)
    task = result.scalars().first()
    
    if task:
        return {
            "task_id": task.task_id,
            "status": task.status,
            "result": task.result,
            "agent_id": task.agent_id,
            "goal_id": task.goal_id,
            "thought_process": task.thought_process
        }
    
    return {"task_id": task_id, "status": "not_found", "result": None}
