from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey
from ..db.base import Base
import datetime
import uuid

class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id"), index=True, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info") # info, success, warning, error
    is_read = Column(Boolean, default=False)
    link = Column(String, nullable=True) # Optional link to a resource (task, agent, etc)
    
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None))

    def to_dict(self):
        return {
            "id": self.notification_id,
            "title": self.title,
            "message": self.message,
            "type": self.type,
            "is_read": self.is_read,
            "link": self.link,
            "created_at": self.created_at.isoformat()
        }
