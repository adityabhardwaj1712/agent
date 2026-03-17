from sqlalchemy import Column, String, DateTime, Text
import sqlalchemy as sa
from ..db.base import Base
import datetime

class Agent(Base):
    __tablename__ = "agents"

    agent_id = Column(String, primary_key=True)
    name = Column(String)
    owner_id = Column(String)
    scopes = Column(Text, default="READ_MEMORY,WRITE_MEMORY,RUN_TASKS,SEND_PROTOCOL")
    reputation_score = Column(sa.Float, default=50.0)
    total_tasks = Column(sa.Integer, default=0)
    successful_tasks = Column(sa.Integer, default=0)
    failed_tasks = Column(sa.Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
