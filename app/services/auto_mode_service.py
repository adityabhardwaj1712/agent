import asyncio
import json
import os
import time
from typing import Optional, List, Dict
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from openai import AsyncOpenAI

from ..db.database import get_db, async_session_factory
from ..db.redis_client import get_async_redis_client
from ..models.task import Task
from ..models.agent import Agent
from ..core.logging_config import setup_logging
from ..services.task_service import task_service
from ..services.reporting_service import reporting_service
from ..config import settings

logger = setup_logging()

class AutoModeService:
    def __init__(self):
        self.is_running = False
        self._loop_task: Optional[asyncio.Task] = None
        self._redis_key = "agentcloud:auto_mode_enabled"
        self._learning_file = "app/storage/learning_history.json"
        self._ai_client: Optional[AsyncOpenAI] = None
        
        if settings.OPENAI_API_KEY:
            self._ai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def is_enabled(self) -> bool:
        redis = await get_async_redis_client()
        val = await redis.get(self._redis_key)
        # Default to ON if not set
        return val != b"0"

    async def set_enabled(self, enabled: bool):
        redis = await get_async_redis_client()
        await redis.set(self._redis_key, "1" if enabled else "0")
        logger.info(f"Auto Mode set to: {enabled}")

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        self._loop_task = asyncio.create_task(self._main_loop())
        logger.info("Auto Mode Service Started")

    async def stop(self):
        self.is_running = False
        if self._loop_task:
            self._loop_task.cancel()
        logger.info("Auto Mode Service Stopped")

    async def _main_loop(self):
        last_report_time = 0.0
        while self.is_running:
            try:
                if await self.is_enabled():
                    await self._perform_self_healing()
                    await self._perform_optimization()
                    
                    # Daily Report (every 24h)
                    if (time.time() - last_report_time) > 86400:
                        await reporting_service.generate_daily_report()
                        last_report_time = time.time()
            except Exception as e:
                logger.error(f"Error in Auto Mode loop: {e}")
            
            await asyncio.sleep(30)

    async def _perform_self_healing(self):
        async with async_session_factory() as db:
            stmt = select(Task).filter(
                Task.status == "failed",
                Task.retry_count < Task.max_retries
            )
            result = await db.execute(stmt)
            failed_tasks = result.scalars().all()

            if not failed_tasks:
                return

            for task in failed_tasks:
                action = await self._decide_action(task)
                
                if action == "retry":
                    await task_service.retry_failed_tasks(db, [task.task_id])
                    self._log_decision(task.task_id, "retry", "Task failed, auto-retrying.")
                elif action == "switch_agent":
                    # Logic to pick better agent would go here
                    await task_service.retry_failed_tasks(db, [task.task_id])
                    self._log_decision(task.task_id, "switch_agent", "Agent underperforming, switching to redundant peer.")

    async def _decide_action(self, task: Task) -> str:
        """AI-powered decision logic."""
        # 1. Check learning history for this type of task
        # 2. Use GPT if available
        if self._ai_client:
            try:
                payload_str = str(task.payload)
                prompt = f"Task '{task.task_id}' with payload '{payload_str}' failed with status '{task.status}'. Retry count: {task.retry_count}. Should we 'retry', 'switch_agent', or 'ignore'? Respond only with the action word."
                response = await self._ai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=10
                )
                action = response.choices[0].message.content.strip().lower()
                if action in ["retry", "switch_agent", "ignore"]:
                    return action
            except Exception as e:
                logger.error(f"AI Decision error: {e}")
        
        # Fallback to simple retry
        return "retry"

    def _log_decision(self, task_id: str, action: str, reason: str):
        """Persistent history for self-learning."""
        os.makedirs("app/storage", exist_ok=True)
        event = {
            "timestamp": time.time(),
            "task_id": task_id,
            "action": action,
            "reason": reason
        }
        try:
            history = []
            if os.path.exists(self._learning_file):
                with open(self._learning_file, "r") as f:
                    history = json.load(f)
            history.append(event)
            # Keep last 1000 events
            if len(history) > 1000:
                history = history[-1000:]
            with open(self._learning_file, "w") as f:
                json.dump(history, f)
        except Exception as e:
            logger.error(f"Failed to log decision: {e}")

    async def _perform_optimization(self):
        """Autonomous cost and performance optimization."""
        async with async_session_factory() as db:
            # Find agents with high failure rates or high costs
            stmt = select(Agent).filter(Agent.failed_tasks > 10)
            result = await db.execute(stmt)
            underperforming_agents = result.scalars().all()

            for agent in underperforming_agents:
                logger.info(f"Auto Mode: Agent {agent.name} is underperforming. Analyzing optimization...")
                # In a real SaaS, we might auto-reduce their priority or suggest a cheaper model
                self._log_decision(agent.agent_id, "optimize", f"High failure rate ({agent.failed_tasks}). Recommended: Model downgrade or peer-review.")

auto_mode_service = AutoModeService()
