# Security utilities (e.g., password hashing, api key validation)
# This file is part of the core security layer for AgentCloud.

import os
import secrets

VALID_KEYS = set(filter(None, os.getenv("API_KEYS", "").split(",")))

def validate_api_key(api_key: str) -> bool:
    """ Validates a provided API key against allowed keys in environment. """
    if not api_key or not VALID_KEYS:
        return False
    return any(secrets.compare_digest(api_key, k.strip()) for k in VALID_KEYS)
