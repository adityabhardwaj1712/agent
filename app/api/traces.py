from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from ..db.database import get_db
from ..models.trace import Trace
from ..schemas.trace_schema import TraceResponse

router = APIRouter(prefix="/traces")

@router.get("/{task_id}", response_model=List[TraceResponse])
async def get_task_traces(task_id: str, db: AsyncSession = Depends(get_db)):
    """
    AXON Observability: Returns the full step-by-step trace of a task.
    """
    result = await db.execute(
        select(Trace).where(Trace.task_id == task_id).order_by(Trace.created_at.asc())
    )
    traces = result.scalars().all()
    if not traces:
        return []
    return traces
