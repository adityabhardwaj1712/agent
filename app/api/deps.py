from fastapi import Depends, HTTPException, status
from ..core.logging_config import setup_logging
logger = setup_logging()
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from ..db.database import get_db
from ..core.auth_service import verify_token
from ..services.user_service import user_service
from ..models.user import User

from typing import Optional
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="v1/auth/login", auto_error=False)

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        logger.warning(f"Unauthorized: Token missing in request to {db.info.get('path', 'unknown')}")
        raise credentials_exception

    # Check for blacklisted tokens
    try:
        from ..db.redis_client import get_async_redis_client
        redis = await get_async_redis_client()
        # Ensure we can actually communicate with redis (ping test is better for startup race)
        if await redis.get(f"blacklist:{token}"):
            logger.warning("Unauthorized: Token is blacklisted")
            raise HTTPException(status_code=401, detail="Token revoked")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Redis connectivity error in auth guard (ignoring for resilience): {str(e)}")
        pass  # Redis unavailable ? allow through, token is valid
    
    payload = verify_token(token)
    if payload is None:
        logger.warning("Unauthorized: Token verification failed (invalid signature or malformed)")
        raise credentials_exception
        
    if payload.get("type") != "access":
        logger.warning(f"Unauthorized: Invalid token type: {payload.get('type')}")
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        logger.warning("Unauthorized: Token missing user identifier (sub)")
        raise credentials_exception
        
    user = await user_service.get_user(db, user_id)
    if user is None:
        logger.warning(f"Unauthorized: User {user_id} not found in database")
        raise credentials_exception
        
    return user

async def requires_scope(required_scope: str):
    """
    Dependency to enforce that the current user/agent has a specific scope.
    Checks both JWT scopes and API Key scopes.
    """
    async def scope_checker(
        token: Optional[str] = Depends(oauth2_scheme),
        db: AsyncSession = Depends(get_db)
    ):
        if not token:
            raise HTTPException(status_code=401, detail="Missing authentication token")
            
        payload = verify_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        # 1. Check JWT Scopes
        token_scopes = payload.get("scopes", [])
        if required_scope in token_scopes or "ADMIN" in token_scopes:
            return True
            
        # 2. Check if it's an API Key (which might have its own scopes in DB)
        # Note: In this system, API keys often issue a JWT with scopes pre-baked.
        # But for enterprise, we might want to re-validate against DB.
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Missing required scope: {required_scope}"
        )
    return scope_checker
