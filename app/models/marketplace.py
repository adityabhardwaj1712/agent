from sqlalchemy import Column, String, Text, Float, Integer, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base
import datetime
import uuid

class AgentTemplate(Base):
    """Agent template that can be published to marketplace"""
    __tablename__ = "agent_templates"
    
    template_id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    long_description = Column(Text)
    category = Column(String, index=True)
    
    creator_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    creator_name = Column(String)
    
    price = Column(Float, default=0.0)
    config_json = Column(JSON, nullable=False)
    
    version = Column(String, default="1.0.0")
    is_published = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    
    downloads = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    
    thumbnail_url = Column(String)
    tags = Column(JSON)
    
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None))
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None))
    published_at = Column(DateTime)
    
    # Relationships
    creator = relationship("User", back_populates="templates")
    reviews = relationship("TemplateReview", back_populates="template")
    purchases = relationship("TemplatePurchase", back_populates="template")


class TemplatePurchase(Base):
    """Record of template purchases"""
    __tablename__ = "template_purchases"
    
    purchase_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id = Column(String, ForeignKey("agent_templates.template_id"), nullable=False, index=True)
    buyer_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    
    price_paid = Column(Float)
    commission = Column(Float)
    
    stripe_payment_id = Column(String)
    payment_status = Column(String, default="pending")
    
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None))
    
    # Relationships
    template = relationship("AgentTemplate", back_populates="purchases")
    buyer = relationship("User", back_populates="purchases")


class TemplateReview(Base):
    """Reviews and ratings for marketplace templates"""
    __tablename__ = "template_reviews"
    
    review_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id = Column(String, ForeignKey("agent_templates.template_id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    
    rating = Column(Integer, nullable=False)
    title = Column(String)
    review_text = Column(Text)
    
    is_verified_purchase = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None))
    
    # Relationships
    template = relationship("AgentTemplate", back_populates="reviews")
