from pydantic import BaseModel

class MemoryCreate(BaseModel):
    agent_id: str
    content: str

class MemoryResponse(MemoryCreate):
    memory_id: str

    class Config:
        from_attributes = True
