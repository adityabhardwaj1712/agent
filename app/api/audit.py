from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from ..db.database import get_db
from ..models.audit_log import AuditLog
from pydantic import BaseModel
from datetime import datetime

class AuditLogResponse(BaseModel):
    log_id: str
    agent_id: str | None
    action: str
    method: str
    path: str
    status_code: str | None
    created_at: datetime
    detail: str | None

    class Config:
        from_attributes = True

router = APIRouter(prefix="/audit")

@router.get("/logs", response_model=List[AuditLogResponse])
async def get_audit_logs(db: AsyncSession = Depends(get_db)):
    # Query all logs
    result = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(100))
    logs = result.scalars().all()
    return logs
