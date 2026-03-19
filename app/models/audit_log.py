from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from ..db.base import Base
import datetime


class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.user_id"), index=True, nullable=True)
    agent_id = Column(String, nullable=True)
    action = Column(String, nullable=False)
    method = Column(String, nullable=False)
    path = Column(String, nullable=False)
    status_code = Column(String, nullable=True)
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

