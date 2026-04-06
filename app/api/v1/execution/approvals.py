from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ...db.database import get_db
from ...models.approval import ApprovalRequest
from ...models.task import Task
from ..deps import get_current_user
from ...models.user import User
from pydantic import BaseModel
import datetime

router = APIRouter()

class ApprovalResponse(BaseModel):
    request_id: str
    task_id: str
    agent_id: str
    operation: str
    payload: str
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ApprovalResponse])
async def list_approvals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(ApprovalRequest)
        .filter(ApprovalRequest.user_id == current_user.user_id)
        .order_by(ApprovalRequest.created_at.desc())
    )
    return result.scalars().all()

@router.post("/{id}/approve")
async def approve_request(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(ApprovalRequest)
        .filter(ApprovalRequest.request_id == id, ApprovalRequest.user_id == current_user.user_id)
    )
    request = result.scalars().first()
    if not request:
        raise HTTPException(status_code=404, detail="Approval request not found")
    
    request.status = "approved"
    request.processed_at = datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
    await db.commit()
    return {"status": "approved"}

@router.post("/{id}/reject")
async def reject_request(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(ApprovalRequest)
        .filter(ApprovalRequest.request_id == id, ApprovalRequest.user_id == current_user.user_id)
    )
    request = result.scalars().first()
    if not request:
        raise HTTPException(status_code=404, detail="Approval request not found")
    
    request.status = "rejected"
    request.processed_at = datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
    await db.commit()
    return {"status": "rejected"}


