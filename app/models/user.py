from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base
import datetime
import uuid

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # Billing
    stripe_customer_id = Column(String, unique=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    agents = relationship("Agent", back_populates="owner")
    templates = relationship("AgentTemplate", back_populates="creator")
    purchases = relationship("TemplatePurchase", back_populates="buyer")
    subscriptions = relationship("Subscription", back_populates="user")
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")
