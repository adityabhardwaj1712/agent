from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base
import datetime
import uuid

class Notebook(Base):
    __tablename__ = "notebooks"
    
    notebook_id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, index=True, nullable=False)
    content = Column(Text, default="")
    metadata_json = Column(JSON, default={})
    user_id = Column(String, index=True, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None))

class NotebookEntry(Base):
    __tablename__ = "notebook_entries"
    
    entry_id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    notebook_id = Column(String, ForeignKey("notebooks.notebook_id"), nullable=False)
    agent_id = Column(String, index=True, nullable=True)
    content_delta = Column(Text, nullable=False)
    entry_type = Column(String, default="agent_contribution") # agent_contribution, user_edit, system_note
    
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None))
