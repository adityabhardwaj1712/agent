from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from ..db.base import Base
import datetime
import uuid

class Event(Base):
    __tablename__ = "events"

    event_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String, nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=True, index=True)
    agent_id = Column(String, nullable=True, index=True)
    task_id = Column(String, nullable=True, index=True)
    payload = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "user_id": self.user_id,
            "agent_id": self.agent_id,
            "task_id": self.task_id,
            "payload": self.payload,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }
