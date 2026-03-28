from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base
import datetime
import uuid

class Subscription(Base):
    """User subscription information"""
    __tablename__ = "subscriptions"
    
    subscription_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    
    plan = Column(String, nullable=False) # "free", "pro", "business"
    status = Column(String, default="active")
    
    stripe_subscription_id = Column(String, index=True)
    current_period_start = Column(DateTime)
    current_period_end = Column(DateTime)
    
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None))
    
    # Relationships
    user = relationship("User", back_populates="subscriptions")


class UsageRecord(Base):
    """Detailed usage records for billing periods"""
    __tablename__ = "usage_records"
    
    record_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    
    period = Column(String, index=True) # e.g., "2024-03"
    metric = Column(String, index=True) # e.g., "tasks", "tokens"
    quantity = Column(Integer, default=0)
    
    agent_id = Column(String, ForeignKey("agents.agent_id"), nullable=True, index=True)
    task_id = Column(String, ForeignKey("tasks.task_id"), nullable=True, index=True)
    
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None))
