from pydantic import BaseModel
from datetime import datetime
from typing import Any, Optional

class TraceResponse(BaseModel):
    trace_id: str
    task_id: str
    agent_id: str
    step: str
    input_data: Optional[Any] = None
    output_data: Optional[Any] = None
    metadata_info: Optional[Any] = None
    created_at: datetime

    class Config:
        from_attributes = True
