from typing import List, Optional
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.audit import log_audit
from ..core.deps import require_scopes
from ..core.scopes import Scope, CurrentAgent
from ..db.database import get_db
from ..schemas.protocol_schema import ProtocolSendRequest, ProtocolSendResponse, ProtocolMessageResponse
from ..services.protocol_service import send_protocol_message
from ..services.inbox import inbox_service
from ..core.metrics import PROTOCOL_SEND_TOTAL


router = APIRouter(prefix="/protocol")


@router.post("/send", response_model=ProtocolSendResponse)
async def send(
    request: Request,
    data: ProtocolSendRequest,
    db: AsyncSession = Depends(get_db),
    current: CurrentAgent = Depends(require_scopes([Scope.SEND_PROTOCOL])),
):
    if data.from_agent_id != current.agent_id:
        raise HTTPException(status_code=403, detail="from_agent_id must match token agent")

    message_id = await send_protocol_message(db, data)
    PROTOCOL_SEND_TOTAL.inc()
    await log_audit(
        db,
        request=request,
        agent_id=current.agent_id,
        action="protocol.send",
        status_code=200,
        detail={"message_id": message_id, "to_agent_id": data.to_agent_id, "type": data.type},
    )
    return {"message_id": message_id, "status": "sent"}


@router.get("/inbox", response_model=List[ProtocolMessageResponse])
async def get_inbox(
    db: AsyncSession = Depends(get_db),
    current: CurrentAgent = Depends(require_scopes([Scope.READ_MEMORY])), # Using READ_MEMORY as a proxy for inbox access for now
):
    """Retrieves messages for the authenticated agent."""
    messages = await inbox_service.get_messages(db, current.agent_id)
    return messages

