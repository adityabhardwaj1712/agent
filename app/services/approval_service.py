from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import datetime
from ..models.approval import ApprovalRequest

class ApprovalService:
    async def create_request(
        self, 
        db: AsyncSession, 
        task_id: str, 
        agent_id: str, 
        operation: str, 
        payload: str,
        goal_id: str | None = None
    ):
        """
        Creates a new HITL approval request.
        """
        request = ApprovalRequest(
            task_id=task_id,
            agent_id=agent_id,
            goal_id=goal_id,
            operation=operation,
            payload=payload,
            status="pending"
        )
        db.add(request)
        await db.commit()
        await db.refresh(request)
        return request

    async def get_request(self, db: AsyncSession, request_id: str):
        result = await db.execute(
            select(ApprovalRequest).filter(ApprovalRequest.request_id == request_id)
        )
        return result.scalars().first()

    async def list_pending(self, db: AsyncSession):
        result = await db.execute(
            select(ApprovalRequest).filter(ApprovalRequest.status == "pending")
        )
        return result.scalars().all()

approval_service = ApprovalService()
