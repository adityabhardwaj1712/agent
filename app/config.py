from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Optional

class Settings(BaseSettings):
    # DATABASE_URL should use postgresql+asyncpg for async SQLAlchemy
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/agentcloud"
    REDIS_URL: str = "redis://redis:6379/0"
    
    # SECRET_KEY is used for JWT hashing
    SECRET_KEY: str

    @field_validator('SECRET_KEY')
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters")
        if v in ["secret-key-change-me", "change-me", "secret"]:
            raise ValueError("SECRET_KEY cannot use default/common values")
        return v

    JWT_ALGORITHM: str = "HS256"
    
    # Secure Key Loading (Secret env-vars take priority over files)
    JWT_PRIVATE_KEY: Optional[str] = None
    JWT_PUBLIC_KEY: Optional[str] = None
    
    JWT_PRIVATE_KEY_PATH: str = "app/storage/jwt_private.pem"
    JWT_PUBLIC_KEY_PATH: str = "app/storage/jwt_public.pem"
    
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    STRIPE_SECRET_KEY: Optional[str] = None
    
    # CORS Configuration
    CORS_ORIGINS: str = "http://localhost:3000,http://frontend:3000"
    
    # AI Provider Keys (Must be set in .env for production)
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    
    # Legacy / Compatibility
    AGENT_PRIVATE_KEY: Optional[str] = None
    
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
