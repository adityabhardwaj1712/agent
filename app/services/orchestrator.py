from __future__ import annotations

import asyncio
import json
import time
import uuid
from dataclasses import dataclass
from enum import IntEnum
from typing import Any, Dict, Optional
import redis.asyncio as aioredis
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
        parent_task_id: Optional[str] = None,
        task_hash: Optional[str] = None
    ) -> EnqueueResult:
        task_id = str(uuid.uuid4())
        
        # 1. Create DB Record
        task = Task(
            task_id=task_id,
            user_id=user_id,
            agent_id=agent_id,
            payload=payload,
            goal_id=goal_id,
            parent_task_id=parent_task_id,
            status="queued",
            task_hash=task_hash,
            priority_level=int(priority)
        )
        db.add(task)
        await db.commit()

        # 2. Calculate score for ZSET (Priority first, then timestamp)
        # Higher score = higher priority
        # Score = (Priority * 10^12) + (Now)
        score = int(priority) * 1_000_000_000_000 + int(time.time())
        
        task_data = {
            "task_id": task_id,
            "user_id": user_id,
            "payload": payload,
            "agent_id": agent_id,
            "priority": int(priority),
            "goal_id": goal_id,
            "parent_task_id": parent_task_id,
            "task_hash": task_hash,
            "created_at": time.time()
        }

        from ..db.redis_client import get_async_redis_client
        redis = await get_async_redis_client()
        await redis.zadd(QUEUE_KEY, {json.dumps(task_data): score})
        
        logger.info(f"Enqueued task {task_id} with priority {priority.name} (hash={task_hash})")
        return EnqueueResult(task_id=task_id)

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
