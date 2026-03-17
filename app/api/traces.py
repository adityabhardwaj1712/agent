from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from ..db.database import get_db
from ..models.event import Event
from pydantic import BaseModel
import datetime

router = APIRouter(prefix="/traces")

class EventResponse(BaseModel):
    event_id: str
    event_type: str
    agent_id: Optional[str]
    task_id: Optional[str]
    payload: Optional[dict]
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[EventResponse])
async def list_traces(agent_id: Optional[str] = None, task_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Event)
    if agent_id:
        stmt = stmt.filter(Event.agent_id == agent_id)
    if task_id:
        stmt = stmt.filter(Event.task_id == task_id)
    
    stmt = stmt.order_by(Event.timestamp.desc())
    result = await db.execute(stmt.limit(100))
    return result.scalars().all()

@router.get("/{task_id}", response_model=List[EventResponse])
async def get_task_trace(task_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Event).filter(Event.task_id == task_id).order_by(Event.timestamp.asc())
    result = await db.execute(stmt)
    trace = result.scalars().all()
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found for this task")
    return trace
