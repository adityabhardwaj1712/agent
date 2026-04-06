from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Optional

class Settings(BaseSettings):
    # DATABASE_URL should use postgresql+asyncpg for async SQLAlchemy
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/agentcloud"
    REDIS_URL: str = "redis://redis:6379/0"
    SECRET_KEY: str = "secret-key-change-me"

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters for secure signing.")
        if "change-me" in v.lower():
            raise ValueError("SECRET_KEY contains the 'change-me' placeholder. Please provide a real secret.")
        return v
    
    JWT_ALGORITHM: str = "RS256"
    
    # Secure Key Loading (Secret env-vars take priority over files)
    JWT_PRIVATE_KEY: Optional[str] = None
    JWT_PUBLIC_KEY: Optional[str] = None
    
    # Official AgentCloud Alias
    AGENTCLOUD_PRIVATE_KEY: Optional[str] = None
    AGENTCLOUD_PUBLIC_KEY: Optional[str] = None
    
    JWT_PRIVATE_KEY_PATH: str = "app/core/private_key.pem"
    JWT_PUBLIC_KEY_PATH: str = "app/core/public_key.pem"
    
    @property
    def private_key(self) -> str:
        if self.AGENTCLOUD_PRIVATE_KEY:
            return self.AGENTCLOUD_PRIVATE_KEY
        if self.JWT_PRIVATE_KEY:
            return self.JWT_PRIVATE_KEY
        with open(self.JWT_PRIVATE_KEY_PATH, "r") as f:
            return f.read()

    @property
    def public_key(self) -> str:
        if self.AGENTCLOUD_PUBLIC_KEY:
            return self.AGENTCLOUD_PUBLIC_KEY
        if self.JWT_PUBLIC_KEY:
            return self.JWT_PUBLIC_KEY
        with open(self.JWT_PUBLIC_KEY_PATH, "r") as f:
            return f.read()
    
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

    @field_validator("OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GOOGLE_API_KEY", "GROQ_API_KEY", mode="before")
    @classmethod
    def clear_placeholders(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        if "xxx" in v.lower() or "placeholder" in v.lower() or "sk-proj-***" in v:
            return None
        return v
    
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
