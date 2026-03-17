from fastapi import APIRouter, Depends
from ..config import settings
from ..db.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text

router = APIRouter(prefix="/deployment")

@router.get("/info")
async def get_deployment_info():
    return {
        "mode": settings.DEPLOYMENT_MODE,
        "region": settings.DEPLOYMENT_REGION,
        "version": "1.0.0-vision",
        "philosophy": "Calm Intelligence",
        "law_neutrality_active": True
    }

@router.get("/health")
async def deep_health_check(db: AsyncSession = Depends(get_db)):
    try:
        # Check DB
        await db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
        
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "error",
        "timestamp": "2026-03-17T12:00:00Z"
    }
