import os
import sys
from typing import List, Tuple, Optional
from pathlib import Path
from loguru import logger
from ..config import settings

class EnvironmentValidator:
    """
    Orchestrates the validation of the AgentCloud application environment.
    
    Verifies database connectivity configurations, cryptographic keys, 
    AI provider registrations, and security-critical middleware settings.
    """
    
    def __init__(self) -> None:
        """Initializes the validator with empty error and warning registries."""
        self.errors: List[str] = []
        self.warnings: List[str] = []
    
    def validate(self) -> Tuple[bool, List[str], List[str]]:
        """
        Performs a comprehensive suite of environment sanity checks.
        
        Returns:
            Tuple[bool, List[str], List[str]]: A tuple containing (is_valid, errors, warnings).
        """
        self._validate_database_config()
        self._validate_jwt_keys()
        self._validate_ai_providers()
        self._validate_cors()
        self._validate_secret_key()
        return (len(self.errors) == 0, self.errors, self.warnings)
    
    def _validate_database_config(self) -> None:
        """Ensures the primary data store is configured for the active deployment mode."""
        if not settings.DATABASE_URL:
            self.errors.append("Critical Failure: DATABASE_URL is not defined.")
            return
            
        if "postgres:postgres@" in settings.DATABASE_URL and settings.DEPLOYMENT_MODE != "local":
            self.errors.append("Security Breach: Default PostgreSQL credentials detected in non-local context.")
    
    def _validate_jwt_keys(self) -> None:
        """Validates the existence of asymmetric signing keys required for agent identity."""
        if settings.JWT_ALGORITHM.startswith("RS"):
            # Check for direct key content OR file path existence
            # Note: We prioritize the explicitly provided key strings in settings
            has_private = bool(settings.AGENTCLOUD_PRIVATE_KEY) or (settings.JWT_PRIVATE_KEY_PATH and Path(settings.JWT_PRIVATE_KEY_PATH).exists())
            has_public = bool(settings.AGENTCLOUD_PUBLIC_KEY) or (settings.JWT_PUBLIC_KEY_PATH and Path(settings.JWT_PUBLIC_KEY_PATH).exists())
            
            if not has_private:
                self.errors.append(f"Identity Failure: RSA Private key missing. Provide {settings.JWT_PRIVATE_KEY_PATH}")
            if not has_public:
                self.errors.append(f"Identity Failure: RSA Public key missing. Provide {settings.JWT_PUBLIC_KEY_PATH}")

    def _validate_ai_providers(self) -> None:
        """Verifies that at least one primary LLM provider is registered."""
        providers = {
            "OpenAI": settings.OPENAI_API_KEY,
            "Anthropic": settings.ANTHROPIC_API_KEY,
            "Google": settings.GOOGLE_API_KEY,
            "Groq": settings.GROQ_API_KEY
        }
        active_providers = [name for name, key in providers.items() if key and key != "sk-placeholder"]
        
        if not active_providers:
            if settings.DEPLOYMENT_MODE != "local":
                self.errors.append("Cognitive Failure: No valid AI provider keys detected in production mode.")
            else:
                self.warnings.append("Degraded Mode: No real AI API keys provided. Synthetic reasoning will be limited.")
        else:
            logger.info(f"LLM Registry: {', '.join(active_providers)} [ONLINE]")

    def _validate_cors(self) -> None:
        """Ensures CORS policies are hardened for cross-origin security."""
        if settings.DEPLOYMENT_MODE != "local" and (settings.CORS_ORIGINS == "*" or not settings.CORS_ORIGINS):
            self.errors.append("Policy Failure: Wildcard CORS detected in production context.")

    def _validate_secret_key(self) -> None:
        """Validates the entropy of the primary application secret key."""
        if not settings.SECRET_KEY or settings.SECRET_KEY == "secret-key-change-me":
            self.errors.append("Entropy Failure: Default SECRET_KEY detected. System is vulnerable.")
        elif len(settings.SECRET_KEY) < 32:
            self.errors.append("Entropy Failure: SECRET_KEY too short (minimum 32 characters).")

def validate_or_exit() -> None:
    """
    Executes environment validation and forcefully terminates the process on failure.
    """
    validator = EnvironmentValidator()
    is_valid, errors, warnings = validator.validate()
    
    if warnings:
        for w in warnings:
            logger.warning(f"Tactical Advisory: {w}")
    
    if not is_valid:
        print("\n" + "!" * 80)
        print(" AGENTCLOUD BOOT SEQUENCE: CRITICAL ENVIRONMENT FAILURE ".center(80, "!"))
        print("-" * 80)
        for e in errors:
            print(f"  [ERROR] {e}")
        print("!" * 80 + "\n")
        sys.exit(1)
    else:
        logger.success("Environment integrity verified. Proceeding with Launch Sequence.")

def print_environment_summary() -> None:
    """
    Prints a high-fidelity tactical summary of the active system context.
    """
    safe_db = settings.DATABASE_URL.split('@')[-1] if settings.DATABASE_URL and '@' in settings.DATABASE_URL else 'INTERNAL'
    
    print("\n" + "═" * 80)
    print(" AgentCloud Tactical System Context ".center(80, "═"))
    print("─" * 80)
    print(f" [LAUNCH MODE] : {settings.DEPLOYMENT_MODE.upper()}")
    print(f" [SECTOR]      : {settings.DEPLOYMENT_REGION.upper()}")
    print(f" [REGISTRY]    : {safe_db}")
    print(f" [BACKBONE]    : {settings.REDIS_URL}")
    print(f" [VAULT]       : {settings.STORAGE_BACKEND.upper()}")
    print("═" * 80 + "\n")
