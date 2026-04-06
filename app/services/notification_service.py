from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid
import datetime
from ..models.notification import Notification
from loguru import logger

class NotificationService:
    async def create_notification(
        self, 
        db: AsyncSession, 
        user_id: str, 
        title: str, 
        message: str, 
        type: str = "info",
        link: Optional[str] = None
    ) -> Notification:
        """
        Broadcasts a mission-critical alert to a specific commander.
        """
        notification = Notification(
            notification_id=str(uuid.uuid4()),
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            link=link
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        
        # In a real environment, we would also publish to Redis for WebSocket push
        try:
            from ..db.redis_client import get_async_redis_client
            import json
            redis = await get_async_redis_client()
            await redis.publish(f"notifications:{user_id}", json.dumps(notification.to_dict()))
        except Exception as e:
            logger.warning(f"Failed to broadcast notification: {e}")
            
        return notification

    async def list_notifications(
        self, 
        db: AsyncSession, 
        user_id: str, 
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Notification]:
        """
        Retrieves the alert history for a sector commander.
        """
        query = select(Notification).where(Notification.user_id == user_id).order_by(Notification.created_at.desc())
        if unread_only:
            query = query.where(Notification.is_read == False)
        
        result = await db.execute(query.limit(limit))
        return result.scalars().all()

    async def mark_as_read(self, db: AsyncSession, user_id: str, notification_id: str) -> bool:
        """
        Acknowledges and archives a specific alert signal.
        """
        result = await db.execute(
            select(Notification).where(
                Notification.notification_id == notification_id, 
                Notification.user_id == user_id
            )
        )
        notification = result.scalars().first()
        if not notification:
            return False
            
        notification.is_read = True
        await db.commit()
        return True

    async def clear_all(self, db: AsyncSession, user_id: str) -> int:
        """
        Purges all read alerts from the active display registry.
        """
        from sqlalchemy import update
        result = await db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True)
        )
        await db.commit()
        return result.rowcount

notification_service = NotificationService()
