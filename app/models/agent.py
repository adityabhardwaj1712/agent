from sqlalchemy import Column, String, DateTime, Text
from ..db.base import Base
import datetime

class Agent(Base):
    __tablename__ = "agents"

    agent_id = Column(String, primary_key=True)
    name = Column(String)
    owner_id = Column(String)
    scopes = Column(Text, default="READ_MEMORY,WRITE_MEMORY,RUN_TASKS,SEND_PROTOCOL")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
