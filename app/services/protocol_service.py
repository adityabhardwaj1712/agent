import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc


from ..models.protocol_message import ProtocolMessage
from ..schemas.protocol_schema import ProtocolSendRequest
from ..db.redis_client import get_async_redis_client
import json


async def get_protocol_messages(db: AsyncSession, limit: int = 50) -> list[ProtocolMessage]:
    result = await db.execute(
        select(ProtocolMessage)
        .order_by(desc(ProtocolMessage.created_at))
        .limit(limit)
    )
    return list(result.scalars().all())


async def send_protocol_message(db: AsyncSession, data: ProtocolSendRequest) -> str:
    message_id = str(uuid.uuid4())
    payload_str = data.payload if isinstance(data.payload, str) else json.dumps(data.payload)
    message = ProtocolMessage(
            message_id=message_id,
            from_agent_id=data.from_agent_id,
            to_agent_id=data.to_agent_id,
            message_type=data.type,
            payload=payload_str,
            correlation_id=data.correlation_id,
        )
    db.add(message)
    await db.commit()

    # Publish to Redis for real-time delivery
    r = await get_async_redis_client()
    event_payload = {
        "message_id": message_id,
        "from_agent_id": data.from_agent_id,
        "to_agent_id": data.to_agent_id,
        "type": data.type,
        "payload": data.payload,
        "correlation_id": data.correlation_id
    }
    await r.publish(f"agent:{data.to_agent_id}", json.dumps(event_payload))

    return message_id


