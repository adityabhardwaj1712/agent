from sqlalchemy import Column, String, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..db.base import Base
import datetime
import uuid

class TaskTemplate(Base):
    __tablename__ = "task_templates"

    template_id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    agent_id = Column(String, ForeignKey("agents.agent_id"))
    payload = Column(JSON)
    user_id = Column(String, ForeignKey("users.user_id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")
    agent = relationship("Agent")
