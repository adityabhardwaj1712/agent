from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel
import datetime

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.api_key_service import api_key_service

router = APIRouter()

class APIKeyCreate(BaseModel):
    label: str
    scopes: Optional[List[str]] = None
    duration_days: Optional[int] = None

class APIKeyResponse(BaseModel):
    id: str
    label: str
    prefix: str
    scopes: List[str]
    created_at: datetime.datetime
    expires_at: Optional[datetime.datetime]
    last_used_at: Optional[datetime.datetime]

    class Config:
        from_attributes = True

@router.post("/", response_model=dict)
async def create_api_key(
    req: APIKeyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    api_key, plain_secret = await api_key_service.create_api_key(
        db=db,
        user_id=current_user.user_id,
        label=req.label,
        scopes=req.scopes,
        duration_days=req.duration_days
    )
    return {
        "id": api_key.id,
        "label": api_key.label,
        "prefix": api_key.prefix,
        "plain_secret": plain_secret,
    }

@router.get("/", response_model=List[APIKeyResponse])
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    keys = await api_key_service.list_user_keys(db, current_user.user_id)
    return keys

@router.delete("/{key_id}")
async def revoke_api_key(
    key_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = await api_key_service.delete_api_key(db, key_id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="API Key not found or access denied")
    return {"message": "API key revoked successfully"}
