from __future__ import annotations

import asyncio
import json
import os
import time
import uuid
from dataclasses import dataclass
from enum import IntEnum
from typing import Any, Dict, Optional
import redis.asyncio as aioredis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from ..config import settings
from ..db.database import AsyncSessionLocal
from ..models.task import Task
from ..models.agent import Agent

QUEUE_KEY = "agent_tasks_priority"

class Priority(IntEnum):
    LOW = 1
    NORMAL = 5
    HIGH = 10
    CRITICAL = 50

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
    Modernized Orchestrator using Redis ZSETs for priority queuing.
    Supports async dequeue and integrated metrics.
    """

    async def enqueue_task(
        self, 
        db: AsyncSession,
        payload: str, 
        user_id: str,
        agent_id: Optional[str] = None, 
        priority: Priority = Priority.NORMAL,
        goal_id: Optional[str] = None, 
        node_id: Optional[str] = None,
        parent_task_id: Optional[str] = None,
        task_hash: Optional[str] = None,
        model_override: Optional[str] = None
    ) -> EnqueueResult:
        task_id = str(uuid.uuid4())
        
        # 1. Create DB Record
        task = Task(
            task_id=task_id,
            user_id=user_id,
            agent_id=agent_id,
            payload=payload,
            goal_id=goal_id,
            node_id=node_id,
            parent_task_id=parent_task_id,
            status="queued",
            task_hash=task_hash,
            priority_level=int(priority)
        )
        db.add(task)
        await db.commit()


        
        # 2. Prepare task payload
        task_data = {
            "task_id": task_id,
            "user_id": user_id,
            "payload": payload,
            "agent_id": agent_id,
            "priority": int(priority),
            "goal_id": goal_id,
            "node_id": node_id,
            "parent_task_id": parent_task_id,
            "task_hash": task_hash,
            "model_override": model_override,
            "created_at": time.time()
        }

        # 3. Enqueue to ARQ
        try:
            from ..db.redis_client import get_shared_arq_pool
            arq_pool = await get_shared_arq_pool()
            await arq_pool.enqueue_job('run_agent_task', task_data, _job_id=task_id)
            logger.info(f"Enqueued ARQ job {task_id} with priority {priority.name}")
        except Exception as e:
            logger.error(f"ARQ Enqueue failed for task {task_id}: {e}")
            # Fallback to local queue if ARQ fails? 
            # For now, we trust ARQ but log the critical failure.
        
        return EnqueueResult(task_id=task_id)

    async def execute_task(
        self, 
        payload: str, 
        priority: Priority = Priority.NORMAL, 
        user_id: str = "system",
        model_override: Optional[str] = None
    ) -> str:
        """
        Submits a task and waits for the result (Synchronous-over-Async pattern).
        """
        async with AsyncSessionLocal() as db:
            res = await self.enqueue_task(
                db=db, 
                payload=payload, 
                user_id=user_id, 
                priority=priority,
                model_override=model_override
            )
            task_id = res.task_id
            
        return await self._wait_for_task(task_id)

    async def _wait_for_task(self, task_id: str, timeout: int = 120) -> str:
        """
        Polls for task completion using Redis PubSub for real-time efficiency.
        """
        from ..db.redis_client import get_async_redis_client
        redis = await get_async_redis_client()
        pubsub = redis.pubsub()
        channel = f"task_status:{task_id}"
        
        await pubsub.subscribe(channel)
        logger.info(f"Subscribed to {channel} for task completion")

        start_time = time.time()
        try:
            while time.time() - start_time < timeout:
                # 1. Check for PubSub message
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message:
                    data = json.loads(message["data"])
                    status = data.get("status")
                    if status == "completed":
                        return data.get("result") or ""
                    if status == "failed":
                        raise Exception(f"Task {task_id} failed: {data.get('error')}")

                # 2. Periodic DB Fallback (every 5 seconds)
                if int(time.time() - start_time) % 5 == 0:
                    async with AsyncSessionLocal() as db:
                        result = await db.execute(select(Task).where(Task.task_id == task_id))
                        task = result.scalars().first()
                        if task:
                            if task.status == "completed":
                                return task.result or ""
                            if task.status == "failed":
                                raise Exception(f"Task {task_id} failed: {task.result}")
                
                await asyncio.sleep(0.1)
        finally:
            await pubsub.unsubscribe(channel)
            
        raise TimeoutError(f"Task {task_id} timed out after {timeout} seconds")

async def dequeue_next_task(redis_client: aioredis.Redis) -> Optional[Dict[str, Any]]:
    """
    Pops the highest priority task from the ZSET.
    """
    # ZPOPMIN would be for lowest score. For priority where HIGH=50, we want ZPOPMAX.
    results = await redis_client.zpopmax(QUEUE_KEY, count=1)
    if not results:
        return None
    
    # results is a list of (member, score)
    task_json, score = results[0]
    return json.loads(task_json)

async def run_reputation_decay_scheduler(interval_seconds: int = 3600):
    """
    Periodically decays agent reputations to ensure recent performance matters more.
    """
    while True:
        try:
            logger.info("Running reputation decay cycle...")
            from .reputation import decay_all_reputations
            async with AsyncSessionLocal() as db:
                await decay_all_reputations(db)
            await asyncio.sleep(interval_seconds)
        except Exception as e:
            logger.error(f"Reputation decay error: {e}")
            await asyncio.sleep(60)

orchestrator = Orchestrator()
