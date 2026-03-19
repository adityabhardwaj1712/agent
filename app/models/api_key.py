from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base
import datetime
import uuid
import secrets
import hashlib

class APIKey(Base):
    __tablename__ = "api_keys"
    
    key_id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    
    # We store a hashed version of the secret, similar to passwords
    hashed_secret = Column(String, nullable=False)
    
    # Prefix for identification (e.g., 'ac_live_...')
    prefix = Column(String, nullable=False)
    
    label = Column(String)
    scopes = Column(JSON, default=list) # e.g. ["tasks:read", "agents:run"]
    
    last_used_at = Column(DateTime)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="api_keys")

    @staticmethod
    def generate_key_pair() -> tuple[str, str]:
        """Generates a (prefix, plain_secret) pair."""
        prefix = "ac_" + secrets.token_hex(4)
        secret = secrets.token_urlsafe(32)
        return prefix, f"{prefix}_{secret}"

    @staticmethod
    def hash_secret(plain_secret: str) -> str:
        return hashlib.sha256(plain_secret.encode()).hexdigest()
