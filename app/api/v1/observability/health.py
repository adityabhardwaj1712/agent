from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_db
from app.db.redis_client import get_async_redis_client
import time

router = APIRouter()

@router.get("/")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Fleet Health Diagnostic: Verifies core infrastructure integrity including PGVector.
    """
    start_time = time.time()
    
    # 1. Check Postgres
    db_status = "unhealthy"
    try:
        await db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # 2. Check Vector Engine (pgvector)
    vector_status = "inactive"
    try:
        # Check if extension is installed and active
        ext_check = await db.execute(text("SELECT 1 FROM pg_extension WHERE extname = 'vector'"))
        if ext_check.scalar():
            vector_status = "active"
    except:
        pass

    # 3. Check Redis
    redis_status = "unhealthy"
    try:
        redis = await get_async_redis_client()
        await redis.ping()
        redis_status = "healthy"
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"

    latency_ms = (time.time() - start_time) * 1000

    return {
        "status": "operational" if db_status == "healthy" and redis_status == "healthy" else "degraded",
        "latency_ms": round(latency_ms, 2),
        "infrastructure": {
            "postgres": db_status,
            "redis": redis_status,
            "vector_engine": vector_status
        },
        "version": "6.0.0-enterprise",
        "timestamp": time.time()
    }
