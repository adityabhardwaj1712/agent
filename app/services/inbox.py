import logging
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.protocol_message import ProtocolMessage

logger = logging.getLogger(__name__)

class InboxService:
    """
    Agent Inbox: Manages message delivery and retrieval for agents.
    """

    @staticmethod
    async def get_messages(db: AsyncSession, agent_id: str, unread_only: bool = False) -> List[ProtocolMessage]:
        stmt = select(ProtocolMessage).where(ProtocolMessage.to_agent_id == agent_id)
        
        # In the future, we might add a 'read' status to ProtocolMessage
        # For now, we list all messages for the agent ordered by time.
        stmt = stmt.order_by(ProtocolMessage.created_at.desc())
        
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def mark_as_read(db: AsyncSession, message_id: str):
        # Placeholder for read tracking logic
        pass

inbox_service = InboxService()
