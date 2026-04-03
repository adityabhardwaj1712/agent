from fastapi import Depends, HTTPException, status
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
        raise credentials_exception

    # Check for blacklisted tokens
    try:
        from ..db.redis_client import get_async_redis_client
        redis = await get_async_redis_client()
        if await redis.get(f"blacklist:{token}"):
            raise HTTPException(status_code=401, detail="Token revoked")
    except HTTPException:
        raise
    except Exception:
        pass  # Redis unavailable — allow through, token is valid
    
    payload = verify_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    user = await user_service.get_user(db, user_id)
    if user is None:
        raise credentials_exception
        
    return user
