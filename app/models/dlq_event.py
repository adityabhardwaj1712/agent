from sqlalchemy import Column, String, DateTime, Text
from app.db.base import Base
import datetime
import uuid

class DLQEvent(Base):
    __tablename__ = "dlq_events"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String, index=True, nullable=True)
    agent_id = Column(String, index=True, nullable=True)
    payload = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
