from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..db.database import get_db
from ..schemas.billing_schema import SubscriptionResponse, UsageRecordResponse, BillingSummary
from ..services.billing_service import billing_service
from ..core.deps import get_current_user

router = APIRouter()

@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Get current user subscription details.
    """
    # Assuming user.subscriptions is a list and we want the active one
    # For now, we'll just check the DB
    from sqlalchemy import select
    from ..models.billing import Subscription
    
    query = select(Subscription).where(
        Subscription.user_id == user.user_id,
        Subscription.status == "active"
    )
    result = await db.execute(query)
    sub = result.scalar_one_or_none()
    
    if not sub:
        # Auto-create free sub if missing
        return await billing_service.create_subscription(db, user.user_id, "free")
    
    return sub

@router.get("/usage", response_model=dict)
async def get_usage(
    user = Depends(get_current_user)
):
    """
    Get usage summary for the current billing period.
    """
    return await billing_service.get_usage_summary(user.user_id)

@router.post("/subscribe")
async def create_subscription(
    plan: str,
    payment_method_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Subscribe to a paid plan.
    """
    try:
        return await billing_service.create_subscription(db, user.user_id, plan, payment_method_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
