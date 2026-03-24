from sqlalchemy import Column, String, DateTime, Text, ForeignKey
import sqlalchemy as sa
from ..db.base import Base
import datetime

class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.user_id"), index=True)
    agent_id = Column(String, index=True)
    goal_id = Column(String, index=True, nullable=True)
    parent_task_id = Column(String, index=True, nullable=True)
    payload = Column(Text)
    status = Column(String, default="queued")  # queued, processing, completed, failed, pending_approval, deduplicated
    result = Column(Text, nullable=True)
    thought_process = Column(Text, nullable=True)
    input_data = Column(Text, nullable=True)
    output_data = Column(Text, nullable=True)
    cost = Column(sa.Float, default=0.0)
    model_used = Column(String, nullable=True)

    # --- Productivity Fields ---
    task_hash = Column(String, index=True, nullable=True)       # MD5 of payload+agent for deduplication
    priority_level = Column(sa.Integer, default=5)              # 1=low, 5=normal, 10=high, 50=critical
    retry_count = Column(sa.Integer, default=0)                 # Auto-retry tracking
    max_retries = Column(sa.Integer, default=3)                 # Max retry attempts
    is_cached_result = Column(sa.Boolean, default=False)        # True if result came from cache/dedup
    execution_time_ms = Column(sa.Integer, nullable=True)       # Track execution duration

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
