from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from ...core.auth_service import create_user_token, create_refresh_token, verify_token
from ...db.redis_client import get_async_redis_client
import time

import uuid

from ...services.user_service import user_service
from ...schemas.user_schema import UserCreate, UserResponse, Token
from ...db.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from ...models.user import User
from ..deps import get_current_user, oauth2_scheme

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(req: UserCreate, db: AsyncSession = Depends(get_db)):
    existing_user = await user_service.get_user_by_email(db, req.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = await user_service.create_user(db, req)
    return user

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    user = await user_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_user_token(user.user_id)
    refresh_token = create_refresh_token(user.user_id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token
    }

@router.post("/refresh", response_model=Token)
async def refresh(refresh_token: str, db: AsyncSession = Depends(get_db)):
    payload = verify_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user_id = payload.get("sub")
    user = await user_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    new_access = create_user_token(user.user_id)
    return {"access_token": new_access, "token_type": "bearer", "refresh_token": refresh_token}

@router.post("/logout")
async def logout(
    token: str = Depends(oauth2_scheme), 
    payload: dict = Depends(verify_token),
    current_user: User = Depends(get_current_user)
):
    if payload:
        exp = payload.get("exp", 0)
        ttl = max(0, int(exp - time.time()))
        redis = await get_async_redis_client()
        await redis.setex(f"blacklist:{token}", ttl, "1")
    return {"message": "Logged out"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
