from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, Field
from typing import Optional, List
import sys
import io

class Settings(BaseSettings):
    """
    Main configuration schema for the AgentCloud Tactical Platform.
    
    Loads configuration from environment variables and .env files with 
    strict validation for security-critical parameters.
    """
    
    # --- Infrastructure Root ---
    PROJECT_NAME: str = "AgentCloud Mission Control"
    VERSION: str = "6.0.0-enterprise"
    DEPLOYMENT_MODE: str = Field(default="local", pattern="^(local|cloud|byoc|onprem)$")
    DEPLOYMENT_REGION: str = "us-east-1"
    LOG_LEVEL: str = "INFO"
    
    # --- Data & Communication ---
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/agentcloud"
    REDIS_URL: str = "redis://redis:6379/0"
    STORAGE_BACKEND: str = "local" # local, s3, gcs
    
    # --- Security & Identity ---
    SECRET_KEY: str = "secret-key-change-me-to-something-at-least-thirty-two-chars"
    JWT_ALGORITHM: str = "RS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480 # 8 hours for tactical shifts
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # RSA Key Management
    AGENTCLOUD_PRIVATE_KEY: Optional[str] = None
    AGENTCLOUD_PUBLIC_KEY: Optional[str] = None
    JWT_PRIVATE_KEY_PATH: str = "app/core/private_key.pem"
    JWT_PUBLIC_KEY_PATH: str = "app/core/public_key.pem"
    
    # --- Commerce & Billing ---
    STRIPE_SECRET_KEY: Optional[str] = None
    
    # --- Network ---
    CORS_ORIGINS: str = "http://localhost:3000"
    
    # --- AI Backbone (Primary Keys) ---
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    
    # --- Ecosystem Integrations ---
    SLACK_BOT_TOKEN: Optional[str] = None
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "notifications@agentcloud.ai"

    # --- Property Accessors ---
    @property
    def private_key(self) -> str:
        """Retrieves RSA private key from env or local storage."""
        if self.AGENTCLOUD_PRIVATE_KEY:
            return self.AGENTCLOUD_PRIVATE_KEY
        try:
            with open(self.JWT_PRIVATE_KEY_PATH, "r", encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            return ""

    @property
    def public_key(self) -> str:
        """Retrieves RSA public key from env or local storage."""
        if self.AGENTCLOUD_PUBLIC_KEY:
            return self.AGENTCLOUD_PUBLIC_KEY
        try:
            with open(self.JWT_PUBLIC_KEY_PATH, "r", encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            return ""

    # --- Validations ---
    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters for tactical signing.")
        return v

    @field_validator("OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GOOGLE_API_KEY", "GROQ_API_KEY", mode="before")
    @classmethod
    def clear_placeholders(cls, v: Optional[str]) -> Optional[str]:
        if not v or any(p in v.lower() for p in ["xxx", "placeholder", "sk-proj-***"]):
            return None
        return v

    # --- Configuration Source ---
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
