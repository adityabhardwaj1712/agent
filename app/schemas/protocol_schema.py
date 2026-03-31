from pydantic import BaseModel
from typing import Optional, Any


class ProtocolSendRequest(BaseModel):
    from_agent_id: str
    to_agent_id: str
    type: str
    payload: Any
    correlation_id: Optional[str] = None


class ProtocolSendResponse(BaseModel):
    message_id: str
    status: str


class ProtocolMessageResponse(BaseModel):
    message_id: str
    from_agent_id: str
    to_agent_id: str
    message_type: str
    payload: str
    correlation_id: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True

