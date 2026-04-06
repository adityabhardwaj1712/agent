from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.billing_service import billing_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/subscription")
async def get_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = await billing_service.get_detailed_analytics(db, current_user.user_id)
    if not sub:
        return {"status": "none", "plan": "free"}
    return sub

@router.get("/usage")
async def get_usage(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    usage = await billing_service.get_usage_summary(current_user.user_id)
    return usage

@router.get("/predict")
async def get_cost_prediction(
    current_user: User = Depends(get_current_user)
):
    return await billing_service.predict_monthly_cost(current_user.user_id)

@router.get("/optimize")
async def get_optimization_suggestions(
    budget: float = 100.0,
    current_user: User = Depends(get_current_user)
):
    return await billing_service.auto_optimize_models(current_user.user_id, budget)
