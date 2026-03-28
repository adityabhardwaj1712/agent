from sqlalchemy import Column, String, DateTime, Text
from app.db.base import Base
import datetime
import uuid

class CircuitBreakerLog(Base):
    __tablename__ = "circuit_breaker_log"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String, index=True, nullable=False)
    state_from = Column(String, nullable=False)
    state_to = Column(String, nullable=False)
    reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None))
