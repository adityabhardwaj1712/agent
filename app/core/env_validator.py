import os
import sys
from typing import List, Tuple
from pathlib import Path
from ..config import settings

class EnvironmentValidator:
    """Validates environment configuration by checking the settings object"""
    
    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []
    
    def validate(self) -> Tuple[bool, List[str], List[str]]:
        self._validate_secrets()
        self._validate_database_config()
        self._validate_jwt_keys()
        self._validate_ai_providers()
        self._validate_cors()
        return (len(self.errors) == 0, self.errors, self.warnings)
    
    def _validate_secrets(self):
        if settings.SECRET_KEY == "secret-key-change-me":
            self.errors.append("SECRET_KEY is still default. Please generate a strong key (e.g. openssl rand -hex 32).")
    
    def _validate_database_config(self):
        if "postgres:postgres@" in settings.DATABASE_URL and settings.DEPLOYMENT_MODE != "local":
            self.errors.append("DATABASE_URL contains default credentials in non-local mode.")
    
    def _validate_jwt_keys(self):
        if not Path(settings.JWT_PRIVATE_KEY_PATH).exists():
            self.errors.append(f"JWT private key missing at {settings.JWT_PRIVATE_KEY_PATH}")
        if not Path(settings.JWT_PUBLIC_KEY_PATH).exists():
            self.errors.append(f"JWT public key missing at {settings.JWT_PUBLIC_KEY_PATH}")
    
    def _validate_ai_providers(self):
        # Determine if at least one valid key exists
        valid_keys = [
            settings.OPENAI_API_KEY, 
            settings.ANTHROPIC_API_KEY, 
            settings.GOOGLE_API_KEY
        ]
        has_real_key = any(k and k != "sk-placeholder" for k in valid_keys)
        
        if settings.DEPLOYMENT_MODE != "local" and not has_real_key:
            self.errors.append("Production mode requires at least one valid AI API key (OpenAI, Anthropic, or Google).")
        elif not has_real_key:
            self.warnings.append("No real AI API keys detected. Agent reasoning will fail.")

    def _validate_cors(self):
        if settings.DEPLOYMENT_MODE != "local" and settings.CORS_ORIGINS == "*":
            self.errors.append("Wildcard CORS (CORS_ORIGINS=*) is not allowed in production.")

def validate_or_exit():
    validator = EnvironmentValidator()
    is_valid, errors, warnings = validator.validate()
    
    if warnings:
        for w in warnings:
            print(f"  [Environment WARNING] {w}")
    
    if not is_valid:
        print("\n" + "!" * 40)
        print("AGENTCLOUD ENVIRONMENT VALIDATION FAILED")
        print("-" * 40)
        for e in errors:
            print(f"  - {e}")
        print("!" * 40 + "\n")
        sys.exit(1)
    else:
        print("✓ AgentCloud Environment Validation Passed")

def print_environment_summary():
    print("\n" + "="*40)
    print("AgentCloud System Context")
    print("-" * 40)
    print(f"Deployment Mode : {settings.DEPLOYMENT_MODE}")
    print(f"Region          : {settings.DEPLOYMENT_REGION}")
    print(f"Database        : {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'HIDDEN'}")
    print(f"Redis           : {settings.REDIS_URL}")
    print(f"CORS Origins    : {settings.CORS_ORIGINS}")
    print("="*40 + "\n")
