from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.audit_log import AuditLog

router = APIRouter()

@router.get("/logs")
async def get_audit_logs(
    action: Optional[str] = None,
    agent_id: Optional[str] = None,
    task_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(AuditLog).where(AuditLog.user_id == current_user.user_id)
    
    if action:
        query = query.where(AuditLog.action_type.ilike(f"%{action}%"))
    if agent_id:
        query = query.where(AuditLog.agent_id == agent_id)
    if task_id:
        query = query.where(AuditLog.task_id == task_id)
        
    result = await db.execute(
        query.order_by(AuditLog.timestamp.desc()).limit(100)
    )
    logs = result.scalars().all()
    return [
        {
            "log_id": l.log_id,
            "action": l.action_type,
            "agent_id": l.agent_id,
            "task_id": l.task_id,
            "detail": l.action_detail,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
            "ip_address": l.ip_address,
        }
        for l in logs
    ]
