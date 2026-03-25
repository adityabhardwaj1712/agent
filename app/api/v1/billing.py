from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ...db.database import get_db
from ...services.billing_service import BillingService
from ...api.deps import get_current_user
from ...models.user import User

router = APIRouter()

@router.get("/subscription")
async def get_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = await BillingService.get_user_subscription(db, current_user.user_id)
    if not sub:
        return {"status": "none", "plan": "free"}
    return sub

@router.get("/usage")
async def get_usage(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    usage = await BillingService.get_usage_metrics(current_user.user_id)
    return usage

