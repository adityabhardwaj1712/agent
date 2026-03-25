from pydantic import BaseModel, field_validator
from typing import Optional, List

class AgentBase(BaseModel):
    name: str
    role: Optional[str] = None
    description: Optional[str] = None
    personality_config: Optional[str] = None
    owner_id: str
    model_name: Optional[str] = "gpt-4o"
    base_cost: Optional[float] = 0.01

class AgentCreate(AgentBase):
    scopes: Optional[List[str]] = None

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    description: Optional[str] = None
    personality_config: Optional[str] = None

class AgentResponse(BaseModel):
    agent_id: str
    name: str
    role: Optional[str] = None
    description: Optional[str] = None
    personality_config: Optional[str] = None
    owner_id: str
    scopes: List[str] = []
    reputation_score: float = 50.0
    total_tasks: int = 0
    successful_tasks: int = 0
    failed_tasks: int = 0
    token: Optional[str] = None

    # FIX: Convert comma-separated string scopes → List[str]
    @field_validator("scopes", mode="before")
    @classmethod
    def parse_scopes_field(cls, v):
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        if v is None:
            return []
        return v

    class Config:
        from_attributes = True
