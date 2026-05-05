import redis
import redis.asyncio as aioredis
from ..config import settings

_async_redis_client = None

def get_redis_client() -> redis.Redis:
    return redis.from_url(settings.REDIS_URL, decode_responses=True)

class SafeAsyncRedis:
    def __init__(self, client: aioredis.Redis, default_ttl: int = 7200):
        self._client = client
        self.default_ttl = default_ttl
        
    def __getattr__(self, name):
        return getattr(self._client, name)
        
    async def set(self, name, value, *args, **kwargs):
        if 'ex' not in kwargs and 'px' not in kwargs:
            kwargs['ex'] = self.default_ttl
        return await self._client.set(name, value, *args, **kwargs)

async def get_async_redis_client() -> SafeAsyncRedis:
    global _async_redis_client
    if _async_redis_client is None:
        raw_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        _async_redis_client = SafeAsyncRedis(raw_client)
    return _async_redis_client

_shared_arq_pool = None

async def get_shared_arq_pool():
    global _shared_arq_pool
    if _shared_arq_pool is None:
        from arq import create_pool
        from arq.connections import RedisSettings
        import os
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        _shared_arq_pool = await create_pool(RedisSettings.from_dsn(redis_url))
    return _shared_arq_pool

async def close_shared_arq_pool():
    global _shared_arq_pool
    if _shared_arq_pool is not None:
        await _shared_arq_pool.close()
        _shared_arq_pool = None
