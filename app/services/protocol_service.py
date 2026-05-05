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

async def send_agent_message(db: AsyncSession, sender_id: str, receiver_id: str, message_type: str, payload: dict, correlation_id: str = None) -> str:
    message_id = str(uuid.uuid4())
    payload_str = json.dumps(payload) if isinstance(payload, dict) else str(payload)
    message = ProtocolMessage(
            message_id=message_id,
            from_agent_id=sender_id,
            to_agent_id=receiver_id,
            message_type=message_type,
            payload=payload_str,
            correlation_id=correlation_id,
        )
    db.add(message)
    await db.commit()

    # Publish standard envelope
    r = await get_async_redis_client()
    event_payload = {
        "envelope": "v1.0",
        "message_id": message_id,
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "type": message_type,
        "payload": payload,
        "correlation_id": correlation_id
    }
    await r.publish(f"agent:{receiver_id}", json.dumps(event_payload))

    return message_id


