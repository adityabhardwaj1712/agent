from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict
from app.db.database import get_db
from app.models.trace import Trace
from app.models.task import Task
from app.models.user import User
from app.api.deps import get_current_user
from pydantic import BaseModel
import datetime

router = APIRouter()

class TraceResponse(BaseModel):
    trace_id: str
    task_id: str
    agent_id: str
    step: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[TraceResponse])
async def list_traces(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Trace)
        .join(Task, Trace.task_id == Task.task_id)
        .filter(Task.user_id == current_user.user_id)
        .order_by(Trace.created_at.desc())
        .limit(100)
    )
    return result.scalars().all()

@router.get("/{task_id}/flame")
async def get_flame_graph(
    task_id: str, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Authorization: Ensure task belongs to user
    task_check = await db.execute(select(Task).filter(Task.task_id == task_id, Task.user_id == current_user.user_id))
    if not task_check.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied to this task's traces")

    result = await db.execute(select(Trace).filter(Trace.task_id == task_id).order_by(Trace.created_at.asc()))
    traces = result.scalars().all()
    
    # Simple logic to simulate flame graph stages from sequential traces
    flame = []
    if traces:
        for i in range(len(traces)):
            t = traces[i]
            # Duration is time until next trace or some estimated value for the last one
            dur = 0.1 # default
            if i < len(traces) - 1:
                 dur = (traces[i+1].created_at - t.created_at).total_seconds()
            flame.append({
                "name": t.step,
                "dur": max(0.01, dur),
                "col": "var(--g)" if "success" in (t.step or "").lower() else "var(--a)"
            })
    return flame

