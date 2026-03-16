import uuid
from sqlalchemy.orm import Session

from ..models.protocol_message import ProtocolMessage
from ..schemas.protocol_schema import ProtocolSendRequest


def send_protocol_message(db: Session, data: ProtocolSendRequest) -> str:
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
    db.commit()
    return message_id

