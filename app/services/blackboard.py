import json
from typing import Any, Optional
from ..db.redis_client import get_async_redis_client
from loguru import logger

class BlackboardService:
    """
    A decentralized shared memory space for the swarm.
    Allows agents to share high-volume context without prompt bloat.
    """
    
    def __init__(self, ttl: int = 3600):
        self.ttl = ttl # 1 hour default

    async def set_context(self, goal_id: str, key: str, value: Any):
        redis = await get_async_redis_client()
        full_key = f"blackboard:{goal_id}:{key}"
        await redis.setex(full_key, self.ttl, json.dumps(value))
        logger.debug(f"Blackboard SET [{goal_id}]: {key}")

    async def get_context(self, goal_id: str, key: str) -> Optional[Any]:
        redis = await get_async_redis_client()
        full_key = f"blackboard:{goal_id}:{key}"
        val = await redis.get(full_key)
        if val:
            return json.loads(val)
        return None

    async def get_all_context(self, goal_id: str) -> dict:
        redis = await get_async_redis_client()
        pattern = f"blackboard:{goal_id}:*"
        keys = await redis.keys(pattern)
        results = {}
        for k in keys:
            val = await redis.get(k)
            if val:
                key_name = k.decode().split(":")[-1]
                results[key_name] = json.loads(val)
        return results

blackboard = BlackboardService()
