from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
import sqlalchemy as sa
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
    
    # LLMOps Metrics
    tokens_prompt = Column(sa.Integer, default=0)
    tokens_completion = Column(sa.Integer, default=0)
    total_cost = Column(sa.Float, default=0.0)
    
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None))
    
