from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from celery.result import AsyncResult

from ..workers.celery_worker import celery, run_task


@dataclass(frozen=True)
class EnqueueResult:
    task_id: str


@dataclass(frozen=True)
class TaskStatus:
    task_id: str
    status: str
    result: Optional[str] = None


class Orchestrator:
    def enqueue_task(self, payload: str) -> EnqueueResult:
        result = run_task.delay(payload)
        return EnqueueResult(task_id=result.id)

    def get_status(self, task_id: str) -> TaskStatus:
        result = AsyncResult(task_id, app=celery)
        if result.successful():
            return TaskStatus(task_id=task_id, status="completed", result=str(result.result))
        if result.failed():
            return TaskStatus(task_id=task_id, status="failed", result=str(result.result))
        if result.status in {"PENDING", "RETRY", "STARTED"}:
            return TaskStatus(
                task_id=task_id,
                status="running" if result.status == "STARTED" else "queued",
            )
        return TaskStatus(task_id=task_id, status=result.status.lower())

    def run_workflow(self, name: str, payload: dict) -> str:
        # Temporal-ready stub (future): run named workflow DAG
        raise NotImplementedError("Workflows are not implemented yet")


orchestrator = Orchestrator()

