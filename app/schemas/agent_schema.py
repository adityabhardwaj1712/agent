from pydantic import BaseModel
from typing import Optional, List

class AgentBase(BaseModel):
    name: str
    owner_id: str

class AgentCreate(AgentBase):
    pass

class AgentResponse(AgentBase):
    agent_id: str
    scopes: List[str] = []
    token: Optional[str] = None

    class Config:
        from_attributes = True
