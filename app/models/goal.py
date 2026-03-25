from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from ..db.base import Base
import datetime
import uuid
import uuid

class Goal(Base):
    """
    High-level autonomous goals that can be broken down into multiple tasks.
    """
    __tablename__ = "goals"

    goal_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id"), index=True)
    description = Column(String, nullable=False)
    target_outcome = Column(Text)
    status = Column(String, default="active") # active, completed, failed
    workflow_type = Column(String, default="linear") # linear, dag
    workflow_json = Column(Text) # Stores nodes/edges for DAG
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
