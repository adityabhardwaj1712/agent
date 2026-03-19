import json
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.event import Event
from typing import Any, Dict, Optional

async def log_event(
    db: AsyncSession,
    event_type: str,
    user_id: Optional[str] = None,
    agent_id: Optional[str] = None,
    task_id: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None
):
    event = Event(
        event_type=event_type,
        user_id=user_id,
        agent_id=agent_id,
        task_id=task_id,
        payload=payload
    )
    db.add(event)
    await db.commit()
    return event
