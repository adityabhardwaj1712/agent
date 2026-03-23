from sqlalchemy import Column, String, JSON, Boolean, DateTime, Text
from sqlalchemy.sql import func
from ..db.base import Base

class Tool(Base):
    """
    AXON Tool Registry: Defines tools available for autonomous execution.
    """
    __tablename__ = "tools"

    name = Column(String, primary_key=True)
    description = Column(String, nullable=False)
    parameters_schema = Column(JSON, nullable=False) # JSON Schema for OpenAI Function Calling
    implementation_code = Column(Text, nullable=True) # Python implementation for dynamic tools
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_openai_tool(self):
        """Convert model record to OpenAI tool definition."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters_schema,
            }
        }
