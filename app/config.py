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

    # AI Provider Keys (Must be set in .env for production)
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    
    # Infrastructure (Phase 9)
    DEPLOYMENT_MODE: str = "cloud" # cloud, byoc, onprem
    DEPLOYMENT_REGION: str = "us-east-1"

    # Ecosystem Integrations (Phase 8)
    SLACK_WEBHOOK_URL: Optional[str] = None
    SLACK_BOT_TOKEN: Optional[str] = None
    
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "notifications@agentcloud.ai"
    
    GITHUB_ACCESS_TOKEN: Optional[str] = None
    JIRA_API_URL: Optional[str] = None
    JIRA_API_KEY: Optional[str] = None
    JIRA_USER_EMAIL: Optional[str] = None

    # Environment-based loading
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
