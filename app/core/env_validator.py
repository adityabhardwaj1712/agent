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
        self._validate_database_config()
        self._validate_jwt_keys()
        self._validate_ai_providers()
        self._validate_cors()
        self._validate_secret_key()
        return (len(self.errors) == 0, self.errors, self.warnings)
    
    def _validate_database_config(self):
        if "postgres:postgres@" in settings.DATABASE_URL and settings.DEPLOYMENT_MODE != "local":
            self.errors.append("DATABASE_URL contains default credentials in non-local mode.")
    
    def _validate_jwt_keys(self):
        # Only validate keys if using asymmetric algorithm
        if settings.JWT_ALGORITHM.startswith("RS"):
            # Check for direct key content OR file path existence
            has_private = settings.JWT_PRIVATE_KEY or Path(settings.JWT_PRIVATE_KEY_PATH).exists()
            has_public = settings.JWT_PUBLIC_KEY or Path(settings.JWT_PUBLIC_KEY_PATH).exists()
            
            if not has_private:
                self.errors.append(f"JWT private key missing. Set JWT_PRIVATE_KEY env-var or provide file at {settings.JWT_PRIVATE_KEY_PATH}")
            if not has_public:
                self.errors.append(f"JWT public key missing. Set JWT_PUBLIC_KEY env-var or provide file at {settings.JWT_PUBLIC_KEY_PATH}")

    
    def _validate_ai_providers(self):
        # Determine if at least one valid key exists
        valid_keys = [
            settings.OPENAI_API_KEY, 
            settings.ANTHROPIC_API_KEY, 
            settings.GOOGLE_API_KEY,
            settings.GROQ_API_KEY
        ]
        has_real_key = any(k and k != "sk-placeholder" for k in valid_keys)
        
        if settings.DEPLOYMENT_MODE != "local" and not has_real_key:
            self.errors.append("Production mode requires at least one valid AI API key (OpenAI, Anthropic, Google, or Groq).")
        elif not has_real_key:
            self.warnings.append("No real AI API keys detected. Agent reasoning will fail.")

        # Tool Keys
        if not os.getenv("SERPER_API_KEY"):
            self.warnings.append("SERPER_API_KEY missing. Web search tools will be disabled.")
        if not os.getenv("E2B_API_KEY"):
            self.warnings.append("E2B_API_KEY missing. Cloud Python code execution will be disabled.")

    def _validate_cors(self):
        if settings.DEPLOYMENT_MODE != "local" and (settings.CORS_ORIGINS == "*" or not settings.CORS_ORIGINS):
            self.errors.append("Wildcard or empty CORS_ORIGINS is not allowed in production.")

    def _validate_secret_key(self):
        if not settings.SECRET_KEY or settings.SECRET_KEY == "secret-key-change-me":
            self.errors.append("SECRET_KEY equals the default 'secret-key-change-me'. Change it in .env.")
        elif len(settings.SECRET_KEY) < 32:
            self.errors.append("SECRET_KEY is too short (must be >= 32 chars).")

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
