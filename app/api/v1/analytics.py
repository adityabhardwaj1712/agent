from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ...db.database import get_db
from ...services.reporting_service import reporting_service
from ...services.task_service import get_system_suggestions
from ...schemas.task_schema import SuggestionResponse
from typing import List

router = APIRouter()

@router.get("/summary")
async def get_analytics_summary():
    # In a real app, this would use the reporting_service more dynamically
    # For now, we return a structural summary that matches the KPI row
    return {
        "active_agents": 12,
        "tasks_completed": 1284,
        "error_rate": 0.02,
        "api_cost": 42.50,
        "avg_latency": 450
    }

@router.get("/suggestions", response_model=List[SuggestionResponse])
async def get_suggestions(db: AsyncSession = Depends(get_db)):
    return await get_system_suggestions(db, user_id="demo-user")
