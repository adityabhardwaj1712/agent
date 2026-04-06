from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ...db.database import get_db
from ...api.deps import get_current_user
from ...services.signal_service import signal_service
from ...services import protocol_service
from ...schemas.protocol_schema import ProtocolSendRequest
from ...models.user import User
from datetime import datetime

router = APIRouter()

@router.post("/send", response_model=dict)
async def send_message(
    data: ProtocolSendRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message_id = await protocol_service.send_protocol_message(db, data)
    
    # Emit real-time signal
    await signal_service.emit_signal(
        user_id=current_user.user_id,
        signal_type="PROTOCOL_MESSAGE",
        payload={
            "message_id": message_id,
            "from_agent_id": data.from_agent_id,
            "to_agent_id": data.to_agent_id,
            "message_type": data.type,
            "payload": data.payload,
            "created_at": str(datetime.now())
        }
    )
    
    return {"status": "dispatched", "message_id": message_id}

@router.get("/messages", response_model=list)
async def get_messages(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the history of inter-agent protocol messages.
    """
    messages = await protocol_service.get_protocol_messages(db, limit)
    return messages


@router.get("/status/{message_id}")
async def get_message_status(
    message_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check the delivery status of a protocol message.
    """
    # Placeholder for status checking logic
    return {"message_id": message_id, "status": "delivered"}
