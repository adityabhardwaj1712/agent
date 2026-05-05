from sqlalchemy import Column, String, DateTime, Text
from ..db.base import Base
import datetime


class ProtocolMessage(Base):
    __tablename__ = "protocol_messages"

    message_id = Column(String, primary_key=True)
    from_agent_id = Column(String, nullable=False)
    to_agent_id = Column(String, nullable=False)
    message_type = Column(String, nullable=False)
    payload = Column(Text, nullable=False)
    correlation_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None))
    org_id = Column(String, server_default='default', nullable=False)

