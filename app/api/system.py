from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import time
import os

from ..db.database import get_db
from ..db.redis_client import get_async_redis_client

router = APIRouter()

@router.get("/status")
async def get_system_status(db: AsyncSession = Depends(get_db)):
    """
    Returns the health status of the system components.
    Used for Docker healthchecks and monitoring.
    """
    is_healthy = True
    components = {}
    
    # 1. Check Database
    try:
        start_db = time.time()
        await db.execute(text("SELECT 1"))
        db_latency = time.time() - start_db
        components["database"] = {
            "status": "connected",
            "latency_ms": round(db_latency * 1000, 2)
        }
    except Exception as e:
        is_healthy = False
        components["database"] = {
            "status": "error",
            "message": str(e)
        }
    
    # 2. Check Redis
    try:
        redis_client = await get_async_redis_client()
        start_redis = time.time()
        await redis_client.ping()
        redis_latency = time.time() - start_redis
        components["redis"] = {
            "status": "connected",
            "latency_ms": round(redis_latency * 1000, 2)
        }
    except Exception as e:
        is_healthy = False
        components["redis"] = {
            "status": "error",
            "message": str(e)
        }
        
    return {
        "status": "healthy" if is_healthy else "degraded",
        "timestamp": time.time(),
        "components": components,
        "system": {
            "deployment_mode": os.getenv("DEPLOYMENT_MODE", "local"),
            "version": "1.0.0"
        }
    }
