from pydantic import BaseModel
from typing import Optional


class ProtocolSendRequest(BaseModel):
    from_agent_id: str
    to_agent_id: str
    type: str
    payload: str
    correlation_id: Optional[str] = None


class ProtocolSendResponse(BaseModel):
    message_id: str
    status: str

