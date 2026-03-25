from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ...db.database import get_db
from ...services import protocol_service
from ...schemas.protocol_schema import ProtocolSendRequest
from ...api.deps import get_current_user
from ...models.user import User

router = APIRouter()

@router.post("/send", response_model=dict)
async def send_message(
    data: ProtocolSendRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a protocol-bound message from one agent to another.
    """
    message_id = await protocol_service.send_protocol_message(db, data)
    return {"status": "dispatched", "message_id": message_id}

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
