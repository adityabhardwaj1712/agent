from pydantic import BaseModel
from typing import Optional, List

class AgentBase(BaseModel):
    name: str
    role: Optional[str] = None
    description: Optional[str] = None
    owner_id: str

class AgentCreate(AgentBase):
    pass

class AgentResponse(AgentBase):
    agent_id: str
    scopes: List[str] = []
    reputation_score: float = 50.0
    total_tasks: int = 0
    successful_tasks: int = 0
    failed_tasks: int = 0
    token: Optional[str] = None

    class Config:
        from_attributes = True
