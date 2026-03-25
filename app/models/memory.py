from sqlalchemy import Column, String, DateTime, Text
from pgvector.sqlalchemy import Vector
from ..db.base import Base
import datetime

class Memory(Base):
    __tablename__ = "memories"

    memory_id = Column(String, primary_key=True)
    agent_id = Column(String)
    content = Column(Text)
    embedding = Column(Vector(1536), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.UTC))
