from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class AgentTemplateBase(BaseModel):
    name: str
    description: str
    long_description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = 0.0
    config_json: dict
    thumbnail_url: Optional[str] = None
    tags: Optional[List[str]] = []

class AgentTemplateCreate(AgentTemplateBase):
    pass

class AgentTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    long_description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    config_json: Optional[dict] = None
    thumbnail_url: Optional[str] = None
    tags: Optional[List[str]] = None
    is_published: Optional[bool] = None

class AgentTemplateResponse(AgentTemplateBase):
    template_id: str
    creator_id: str
    creator_name: Optional[str] = None
    version: str
    is_published: bool
    is_verified: bool
    downloads: int
    rating: float
    review_count: int
    created_at: datetime
    published_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TemplatePurchaseCreate(BaseModel):
    template_id: str
    payment_method_id: Optional[str] = None

class TemplatePurchaseResponse(BaseModel):
    purchase_id: str
    template_id: str
    buyer_id: str
    price_paid: float
    payment_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class TemplateReviewCreate(BaseModel):
    template_id: str
    rating: int
    title: Optional[str] = None
    review_text: Optional[str] = None

class TemplateReviewResponse(TemplateReviewCreate):
    review_id: str
    user_id: str
    is_verified_purchase: bool
    created_at: datetime

    class Config:
        from_attributes = True
