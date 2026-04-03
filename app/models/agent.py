from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
import sqlalchemy as sa
from ..db.base import Base
import datetime

class Agent(Base):
    __tablename__ = "agents"

    agent_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=True) # e.g., "Software Engineer", "Researcher"
    description = Column(Text, nullable=True)
    owner_id = Column(String, ForeignKey("users.user_id"), index=True)
    status = Column(String, default="idle", index=True) # running, idle, cooldown, offline
    # Multi-Tenancy
    org_id = Column(sa.String, server_default='default', index=True, nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="agents")
    scopes = Column(Text, default="READ_MEMORY,WRITE_MEMORY,RUN_TASKS,SEND_PROTOCOL")
    reputation_score = Column(sa.Float, default=50.0)
    total_tasks = Column(sa.Integer, default=0)
    successful_tasks = Column(sa.Integer, default=0)
    failed_tasks = Column(sa.Integer, default=0)
    personality_config = Column(Text, nullable=True) # JSON config for persona/tone
    model_name = Column(String, default="gpt-4o")
    base_cost = Column(sa.Float, default=0.01) # Cost per task in credits/USD
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None))
    
