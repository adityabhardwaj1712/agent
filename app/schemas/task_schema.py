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
    task_hash: Optional[str] = None
    is_cached_result: bool = False
    priority_level: int = 5
    retry_count: int = 0
    execution_time_ms: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    result: Optional[str] = None
    agent_id: Optional[str] = None
    is_cached: bool = False
    retry_count: int = 0
    priority: int = 5
    execution_time_ms: Optional[int] = None

class SuggestionResponse(BaseModel):
    type: str # retry, performance, cost
    title: str
    description: str
    action: str
    agent_id: Optional[str] = None
    severity: str # info, warning, critical

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
