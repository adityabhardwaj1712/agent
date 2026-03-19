from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from ..db.base import Base
import datetime

class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.user_id"), index=True)
    agent_id = Column(String, index=True)
    goal_id = Column(String, index=True, nullable=True) # Link to a high-level goal
    parent_task_id = Column(String, index=True, nullable=True) # For task dependencies
    payload = Column(Text)
    status = Column(String, default="queued") # queued, processing, completed, failed, pending_approval
    result = Column(Text, nullable=True)
    thought_process = Column(Text, nullable=True) # Store agent's internal reasoning
    input_data = Column(Text, nullable=True)
    output_data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
