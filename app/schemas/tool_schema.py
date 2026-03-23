from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime

class ToolBase(BaseModel):
    name: str = Field(..., description="Unique identifier for the tool")
    description: str = Field(..., description="Human-readable description of what the tool does")
    parameters_schema: Dict[str, Any] = Field(..., description="OpenAI-compatible function parameters schema")
    implementation_code: Optional[str] = Field(None, description="Python code for the tool")
    is_enabled: bool = True

class ToolCreate(ToolBase):
    pass

class ToolUpdate(BaseModel):
    description: Optional[str] = None
    parameters_schema: Optional[Dict[str, Any]] = None
    implementation_code: Optional[str] = None
    is_enabled: Optional[bool] = None

class ToolResponse(ToolBase):
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
