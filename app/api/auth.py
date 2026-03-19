from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta

from ..db.database import get_db
from ..schemas.user_schema import UserResponse, UserCreate, Token
from ..services.user_service import user_service
from ..core.auth import create_user_token
from ..core.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(schema: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new user.
    """
    db_user = await user_service.get_user_by_email(db, email=schema.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return await user_service.create_user(db=db, schema=schema)

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    """
    OAuth2 compatible token login, retrieve an access token for future requests.
    """
    user = await user_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_user_token(user_id=user.user_id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user = Depends(get_current_user)):
    """
    Get current user profile.
    """
    return current_user
