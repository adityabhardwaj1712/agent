from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
import json
import uuid
from ..db.redis_client import get_redis_client


@dataclass(frozen=True)
class EnqueueResult:
    task_id: str


@dataclass(frozen=True)
class TaskStatus:
    task_id: str
    status: str
    result: Optional[str] = None


class Orchestrator:
    """
    Orchestrator for task management using direct Redis queue.
    Removes Celery dependency for better integration with async workers.
    """
    
    def enqueue_task(self, payload: str, agent_id: Optional[str] = None, 
                     goal_id: Optional[str] = None, 
                     parent_task_id: Optional[str] = None) -> EnqueueResult:
        """
        Enqueue a task to be processed by workers.
        """
        task_id = str(uuid.uuid4())
        
        redis = get_redis_client()
        task_data = {
            "task_id": task_id,
            "payload": payload,
            "agent_id": agent_id,
            "goal_id": goal_id,
            "parent_task_id": parent_task_id
        }
        
        # Push to Redis queue (LPUSH for FIFO with BLPOP)
        redis.lpush("agent_tasks", json.dumps(task_data))
        
        # Increment metrics
        redis.incr("metrics:tasks_submitted_total")
        if agent_id:
            redis.incr(f"metrics:tasks_submitted_by_agent:{agent_id}")
        
        return EnqueueResult(task_id=task_id)

    def get_status(self, task_id: str) -> TaskStatus:
        """
        Synchronous status check using asyncio.run() - handles legacy sync callers.
        """
        import asyncio
        from ..db.database import AsyncSessionLocal
        from ..models.task import Task
        
        async def _get_status():
            async with AsyncSessionLocal() as db:
                task = await db.get(Task, task_id)
                if task:
                    return TaskStatus(
                        task_id=task_id,
                        status=task.status,
                        result=task.result
                    )
                return TaskStatus(task_id=task_id, status="not_found")
        
        try:
            return asyncio.run(_get_status())
        except Exception:
            # Fallback for nested loops
            return TaskStatus(task_id=task_id, status="unknown")

    async def get_status_async(self, task_id: str) -> TaskStatus:
        """
        Async version of status check.
        """
        from ..db.database import AsyncSessionLocal
        from ..models.task import Task
        
        async with AsyncSessionLocal() as db:
            task = await db.get(Task, task_id)
            if task:
                return TaskStatus(
                    task_id=task_id,
                    status=task.status,
                    result=task.result
                )
            return TaskStatus(task_id=task_id, status="not_found")

    def run_workflow(self, name: str, payload: dict) -> str:
        raise NotImplementedError("Workflows are not implemented yet")


orchestrator = Orchestrator()
