from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SubscriptionBase(BaseModel):
    plan: str # "free", "pro", "business"
    status: str = "active"

class SubscriptionResponse(SubscriptionBase):
    subscription_id: str
    user_id: str
    stripe_subscription_id: Optional[str] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UsageRecordBase(BaseModel):
    metric: str
    quantity: int
    period: str

class UsageRecordResponse(UsageRecordBase):
    record_id: str
    user_id: str
    updated_at: datetime

    class Config:
        from_attributes = True

class BillingSummary(BaseModel):
    total_amount: float
    items: List[dict]
    usage: dict
    plan_limits: dict
