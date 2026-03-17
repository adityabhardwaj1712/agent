from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # DATABASE_URL should use postgresql+asyncpg for async SQLAlchemy
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/agentcloud"
    REDIS_URL: str = "redis://redis:6379/0"
    
    # SECRET_KEY is used for non-JWT hashing if needed
    SECRET_KEY: str = "secret-key-change-me"
    JWT_ALGORITHM: str = "RS256"
    JWT_PRIVATE_KEY_PATH: str = "app/core/private_key.pem"
    JWT_PUBLIC_KEY_PATH: str = "app/core/public_key.pem"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week
    
    # CORS Configuration
    CORS_ORIGINS: str = "http://localhost:3000,http://frontend:3000"

    # AI Provider Keys
    OPENAI_API_KEY: str = "sk-placeholder"
    ANTHROPIC_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    
    # Infrastructure (Phase 9)
    DEPLOYMENT_MODE: str = "cloud" # cloud, byoc, onprem
    DEPLOYMENT_REGION: str = "us-east-1"

    # Environment-based loading
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
