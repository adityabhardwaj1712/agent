from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import datetime

from ..db.database import get_db
from ..db.redis_client import get_redis_client
from ..models.approval import ApprovalRequest
from ..schemas.approval_schema import ApprovalRequestResponse, ApprovalAction
import json

router = APIRouter(prefix="/approvals")

@router.get("/", response_model=List[ApprovalRequestResponse])
async def list_approvals(status: str = "pending", db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ApprovalRequest).filter(ApprovalRequest.status == status)
    )
    return result.scalars().all()

@router.post("/{request_id}/action")
async def process_approval(
    request_id: str, 
    data: ApprovalAction, 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ApprovalRequest).filter(ApprovalRequest.request_id == request_id)
    )
    approval = result.scalars().first()
    
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
    
    if approval.status != "pending":
        raise HTTPException(status_code=400, detail=f"Approval already processed: {approval.status}")

    if data.action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'reject'.")

    approval.status = "approved" if data.action == "approve" else "rejected"
    approval.processed_at = datetime.datetime.utcnow()
    approval.processed_by = data.user_id
    
    await db.commit()
    await db.refresh(approval)

    if approval.status == "approved":
        # Re-enqueue the task
        r = get_redis_client()
        task_payload = {
            "task_id": approval.task_id,
            "agent_id": approval.agent_id,
            "goal_id": approval.goal_id,
            "payload": approval.payload
        }
        r.lpush("agent_tasks", json.dumps(task_payload))
        print(f"HITL: Task {approval.task_id} approved and re-enqueued.")
    
    return {"request_id": request_id, "status": approval.status}
