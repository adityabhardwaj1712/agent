from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class TaskBase(BaseModel):
    payload: str
    agent_id: str
    goal_id: Optional[str] = None
    parent_task_id: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    task_id: str
    status: str
    result: Optional[str] = None
    thought_process: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    result: Optional[str] = None
    agent_id: str

class GoalBase(BaseModel):
    description: str
    target_outcome: Optional[str] = None

class GoalCreate(GoalBase):
    pass

class GoalResponse(GoalBase):
    goal_id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
