from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from ..db.base import Base
import datetime
import uuid

class Trace(Base):
    __tablename__ = "traces"

    trace_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String, index=True)
    agent_id = Column(String, index=True)
    step = Column(String)  # e.g., "memory_search", "llm_call", "scoring"
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    metadata_info = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
