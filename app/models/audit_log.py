from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from ..db.base import Base
import datetime
import uuid


class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id"), index=True, nullable=True)
    agent_id = Column(String, ForeignKey("agents.agent_id"), nullable=True, index=True)
    task_id = Column(String, ForeignKey("tasks.task_id"), nullable=True, index=True)
    goal_id = Column(String, nullable=True, index=True)

    # Legacy columns (kept for backward compatibility)
    action = Column(String, nullable=True)
    method = Column(String, nullable=True)
    path = Column(String, nullable=True)
    status_code = Column(String, nullable=True)
    detail = Column(Text, nullable=True)

    # New enterprise columns
    action_type = Column(String, nullable=True, index=True)
    action_detail = Column(JSON, nullable=True)
    ip_address = Column(String, nullable=True)

    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None), index=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None))
    org_id = Column(String, server_default='default', index=True, nullable=False)
    
