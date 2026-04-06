from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from ...core.auth_service import create_user_token, create_refresh_token, verify_token
from ...core.security import get_password_hash, verify_password
from ...db.redis_client import get_async_redis_client
import time
import datetime
from typing import Optional

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
    current_user: User = Depends(get_current_user)
):
    payload = verify_token(token)
    if payload:
        exp = payload.get("exp", 0)
        ttl = max(0, int(exp - time.time()))
        redis = await get_async_redis_client()
        await redis.setex(f"blacklist:{token}", ttl, "1")
    return {"message": "Logged out"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

class ProfileUpdate(BaseModel):
    name: Optional[str] = None

@router.patch("/me", response_model=UserResponse)
async def update_profile(
    updates: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if updates.name is not None:
        current_user.name = updates.name
        current_user.updated_at = datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
    await db.commit()
    await db.refresh(current_user)
    return current_user

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
async def change_password(
    req: ChangePassword,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    current_user.hashed_password = get_password_hash(req.new_password)
    await db.commit()
    return {"message": "Password updated successfully"}
