# Security utilities (e.g., password hashing, api key validation)
# This file is part of the core security layer for AgentCloud.

import os
import secrets

from passlib.context import CryptContext

import hashlib

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

VALID_KEYS = set(filter(None, os.getenv("API_KEYS", "").split(",")))

def _pre_hash(password: str) -> str:
    """Pre-hash password to handle bcrypt's 72-byte limit."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(_pre_hash(plain_password), hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(_pre_hash(password))

def validate_api_key(api_key: str) -> bool:
    """ Validates a provided API key against allowed keys in environment. """
    if not api_key or not VALID_KEYS:
        return False
    return any(secrets.compare_digest(api_key, k.strip()) for k in VALID_KEYS)
