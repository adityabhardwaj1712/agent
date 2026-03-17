from sqlalchemy import Column, String, DateTime, Text, Boolean, ForeignKey
from ..db.base import Base
import datetime
import uuid

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    request_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String, index=True)
    agent_id = Column(String, index=True)
    operation = Column(String)  # e.g., "delete_file", "transfer_funds"
    payload = Column(Text)
    status = Column(String, default="pending")  # pending, approved, rejected
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    processed_by = Column(String, nullable=True)
