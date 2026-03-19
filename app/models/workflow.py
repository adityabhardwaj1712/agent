from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, JSON, Text
from sqlalchemy.orm import relationship
from app.db.base import Base
import datetime
import uuid

class WorkflowRun(Base):
    __tablename__ = "workflow_runs"
    
    run_id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    workflow_name = Column(String, index=True, nullable=False)
    status = Column(String, index=True, nullable=False) # completed, failed, partial
    final_state = Column(JSON)
    user_id = Column(String, index=True, nullable=False)
    total_duration_ms = Column(Integer, default=0)
    error = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    node_results = relationship("WorkflowNodeResult", back_populates="workflow_run", cascade="all, delete-orphan")

class WorkflowNodeResult(Base):
    __tablename__ = "workflow_node_results"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    run_id = Column(String, ForeignKey("workflow_runs.run_id"), nullable=False)
    node_id = Column(String, index=True, nullable=False)
    status = Column(String, nullable=False)
    output = Column(Text)
    error = Column(Text, nullable=True)
    duration_ms = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    workflow_run = relationship("WorkflowRun", back_populates="node_results")
