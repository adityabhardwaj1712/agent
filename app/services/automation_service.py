from typing import Any, Dict, Optional
from loguru import logger
import json
import uuid
import asyncio

from .task_service import send_task
from ..schemas.task_schema import TaskCreate
from .event_bus import event_bus
from ..db.database import AsyncSessionLocal
from ..models.task import Task
from sqlalchemy import select

class AutomationService:
    """
    Orchestrates autonomous task chaining by listening to the event bus.
    If a task completes and matches a known 'Chain' pattern, it automatically
    triggers the next step.
    """

    def __init__(self):
        self._enabled = True

    async def start(self):
        """Register listeners with the event bus."""
        logger.info("Automation Service starting...")
        self._task = asyncio.create_task(event_bus.subscribe(self.handle_task_completion))

    async def handle_task_completion(self, event: dict):
        """Listen for completed tasks and decide if a sequel is needed."""
        if not self._enabled:
            return
            
        if event.get("type") != "task_completed":
            return

        payload = event.get("data", {})
        task_id = payload.get("task_id")
        agent_id = payload.get("agent_id")
        user_id = event.get("user_id") or payload.get("user_id")

        if not task_id or not user_id:
            return

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Task).where(Task.task_id == task_id))
            task = result.scalars().first()
            if not task or not task.result:
                return

            # --- Autonomous Chaining Logic ---
            
            # Example 1: Research -> Summarize
            if "research" in (task.payload or "").lower() and "summary" not in (task.payload or "").lower():
                logger.info(f"Automation: Triggering SUMMARY for research task {task_id}")
                await self._trigger_follow_up(
                    db,
                    user_id=user_id,
                    agent_id=agent_id,
                    parent_task_id=task_id,
                    payload=f"Please provide a concise summary of the following research results:\n\n{task.result[:2000]}",
                )

            # Example 2: Code Generation -> Code Review
            elif "implement" in (task.payload or "").lower() or "write code" in (task.payload or "").lower():
                logger.info(f"Automation: Triggering CODE REVIEW for task {task_id}")
                await self._trigger_follow_up(
                    db,
                    user_id=user_id,
                    agent_id=agent_id, # Could optionally route to a different 'Reviewer' agent here
                    parent_task_id=task_id,
                    payload=f"Please review the following code for bugs, security issues, and style. Suggest improvements:\n\n{task.result[:2000]}",
                )

            # Example 3: Error Detection -> Auto-Retry or Diagnosis
            elif task.status == "failed":
                # This could trigger a 'Diagnostics Agent'
                pass

    async def _trigger_follow_up(
        self,
        db,
        user_id: str,
        agent_id: str,
        parent_task_id: str,
        payload: str,
    ):
        """Helper to create a follow-up task."""
        try:
            task_data = TaskCreate(
                payload=payload,
                agent_id=agent_id,
                parent_task_id=parent_task_id
            )
            # Use send_task to ensure billing and orchestrator logic is applied
            await send_task(db, task_data, user_id=user_id)
        except Exception as e:
            logger.error(f"Failed to trigger autonomous follow-up: {e}")

automation_service = AutomationService()
