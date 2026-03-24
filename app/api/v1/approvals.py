from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ...db.database import get_db
from ...models.approval import ApprovalRequest
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
async def list_approvals(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ApprovalRequest).order_by(ApprovalRequest.created_at.desc()))
    return result.scalars().all()

@router.post("/{id}/approve")
async def approve_request(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ApprovalRequest).filter(ApprovalRequest.request_id == id))
    request = result.scalars().first()
    if not request:
        raise HTTPException(status_code=404, detail="Approval request not found")
    
    request.status = "approved"
    request.processed_at = datetime.datetime.utcnow()
    await db.commit()
    return {"status": "approved"}

@router.post("/{id}/reject")
async def reject_request(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ApprovalRequest).filter(ApprovalRequest.request_id == id))
    request = result.scalars().first()
    if not request:
        raise HTTPException(status_code=404, detail="Approval request not found")
    
    request.status = "rejected"
    request.processed_at = datetime.datetime.utcnow()
    await db.commit()
    return {"status": "rejected"}

