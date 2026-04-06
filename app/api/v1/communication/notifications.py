from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel
import datetime

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.notification import Notification

router = APIRouter()

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime.datetime

    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=obj.notification_id,
            title=obj.title,
            message=obj.message,
            type=obj.type,
            is_read=obj.is_read,
            created_at=obj.created_at
        )

    class Config:
        from_attributes = True

@router.get("/", response_model=List[NotificationResponse])
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Notification)
        .filter(Notification.user_id == current_user.user_id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    notifications = result.scalars().all()
    return [NotificationResponse.from_orm(n) for n in notifications]

@router.patch("/{id}/read")
async def mark_read(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Notification)
        .filter(Notification.notification_id == id, Notification.user_id == current_user.user_id)
    )
    notif = result.scalars().first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    await db.commit()
    return {"message": "Marked as read"}

@router.post("/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Notification)
        .filter(Notification.user_id == current_user.user_id, Notification.is_read == False)
    )
    unread = result.scalars().all()
    for u in unread:
        u.is_read = True
    await db.commit()
    return {"message": "All marked as read"}
