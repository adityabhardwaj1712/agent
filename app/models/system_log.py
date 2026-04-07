from sqlalchemy import Column, String, DateTime, Text, Integer, JSON
from ..db.base import Base
import datetime
import uuid

class SystemLog(Base):
    """
    Storage for application-level logs (previously app.log and errors.log).
    """
    __tablename__ = "system_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    level = Column(String, index=True, nullable=False)  # INFO, ERROR, DEBUG, etc.
    name = Column(String, index=True)                   # Logger name (module)
    function = Column(String)                         # Function name
    line = Column(Integer)                            # Line number
    message = Column(Text, nullable=False)
    exception = Column(Text, nullable=True)           # Stack trace if available
    
    # Metadata for the log record (Loguru context or structured data)
    extra = Column(JSON, nullable=True)

    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None), index=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None))
    
    # org_id is added via TenantMixin in Base
