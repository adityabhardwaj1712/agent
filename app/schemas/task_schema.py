from pydantic import BaseModel
from typing import Optional

class TaskCreate(BaseModel):
    agent_id: str
    payload: str

class TaskResponse(TaskCreate):
    task_id: str
    status: str
    result: Optional[str] = None

    class Config:
        from_attributes = True


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    result: Optional[str] = None
