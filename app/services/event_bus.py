import json
import asyncio
from typing import Any, Callable, Dict
from redis.asyncio import Redis
from ..config import settings
from loguru import logger

class RedisEventBus:
    """
    A Redis-backed Pub/Sub event bus for broadcasting system-wide events.
    Used for real-time WebSocket updates and cross-service communication.
    """
    def __init__(self):
        self.redis: Redis | None = None
        self.channel = "agentcloud_events"
        self._pubsub_task = None
        self._subscribers: Dict[str, Callable] = {}

    async def start_consuming(self):
        """Start consuming events for the worker loop."""
        if not self.redis:
            await self.connect()
        # To avoid the worker immediately returning and logging warnings
        while True:
            await asyncio.sleep(86400)

    async def connect(self):
        if not self.redis:
            try:
                self.redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
                logger.info("Event Bus connected to Redis")
            except Exception as e:
                logger.error(f"Event Bus failed to connect to Redis: {e}")

    async def publish(self, event_type: str, data: Any, source: str = "system"):
        """Publish an event to the Redis channel."""
        if not self.redis:
            await self.connect()
        
        event = {
            "type": event_type,
            "data": data,
            "source": source,
            "timestamp": asyncio.get_running_loop().time()
        }
        
        try:
            if self.redis:
                await self.redis.publish(self.channel, json.dumps(event))
        except Exception as e:
            logger.error(f"Failed to publish event {event_type}: {e}")

    async def subscribe(self, callback: Callable):
        """Subscribe to the event bus. This is used by the WebSocket handlers."""
        if not self.redis:
            await self.connect()
            
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(self.channel)
        
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        event = json.loads(message["data"])
                        await callback(event)
                    except Exception as e:
                        logger.error(f"Error in event bus callback: {e}")
        finally:
            await pubsub.unsubscribe(self.channel)
            await pubsub.close()

async def agent_delegate(
    from_agent_id: str,
    to_agent_id: str,
    task_payload: str,
    user_id: str,
    await_result: bool = True,
    timeout: int = 90
) -> dict:
    """
    Allows one agent to delegate or outsource a task to another specific agent.
    If await_result=True, it blocks until the delegated agent completes the task
    (or times out) and returns the output.
    """
    from .orchestrator import orchestrator, Priority
    from ..db.database import AsyncSessionLocal
    
    logger.info(f"Agent {from_agent_id} delegating task to {to_agent_id} for user {user_id}")
    
    async with AsyncSessionLocal() as db:
        res = await orchestrator.enqueue_task(
            db=db,
            payload=task_payload,
            user_id=user_id,
            agent_id=to_agent_id,
            parent_task_id=None, # In case we have a parent task from context, we could add it
            priority=Priority.NORMAL
        )
        task_id = res.task_id
        
    if await_result:
        try:
            result = await orchestrator._wait_for_task(task_id, timeout=timeout)
            return {"status": "completed", "task_id": task_id, "result": result}
        except Exception as e:
            logger.error(f"Delegated task {task_id} failed or timed out: {e}")
            return {"status": "failed", "task_id": task_id, "error": str(e)}
    
    return {"status": "queued", "task_id": task_id}

event_bus = RedisEventBus()
