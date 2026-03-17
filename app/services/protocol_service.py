import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.protocol_message import ProtocolMessage
from ..schemas.protocol_schema import ProtocolSendRequest


async def send_protocol_message(db: AsyncSession, data: ProtocolSendRequest) -> str:
    message_id = str(uuid.uuid4())
    db.add(
        ProtocolMessage(
            message_id=message_id,
            from_agent_id=data.from_agent_id,
            to_agent_id=data.to_agent_id,
            message_type=data.type,
            payload=data.payload,
            correlation_id=data.correlation_id,
        )
    )
    await db.commit()
    return message_id

