from sqlalchemy import Column, String, DateTime, Text
from ..db.base import Base
import datetime

class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(String, primary_key=True)
    agent_id = Column(String)
    payload = Column(Text)
    status = Column(String, default="queued")
    result = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
