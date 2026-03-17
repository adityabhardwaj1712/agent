from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ApprovalBase(BaseModel):
    task_id: str
    agent_id: str
    operation: str
    payload: str

class ApprovalCreate(ApprovalBase):
    pass

class ApprovalRequestResponse(ApprovalBase):
    request_id: str
    status: str
    created_at: datetime
    processed_at: Optional[datetime] = None
    processed_by: Optional[str] = None

    class Config:
        from_attributes = True

class ApprovalAction(BaseModel):
    action: str  # approve, reject
    user_id: str
