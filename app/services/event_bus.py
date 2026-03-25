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
            "timestamp": asyncio.get_event_loop().time()
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
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    event = json.loads(message["data"])
                    await callback(event)
                except Exception as e:
                    logger.error(f"Error in event bus callback: {e}")

event_bus = RedisEventBus()
