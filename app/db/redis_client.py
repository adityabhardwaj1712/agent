import redis
import redis.asyncio as aioredis
from ..config import settings

_async_redis_client = None

def get_redis_client() -> redis.Redis:
    return redis.from_url(settings.REDIS_URL, decode_responses=True)

async def get_async_redis_client() -> aioredis.Redis:
    global _async_redis_client
    if _async_redis_client is None:
        _async_redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _async_redis_client
