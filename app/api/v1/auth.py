from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from ...core.auth_service import create_user_token
import uuid

router = APIRouter()

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str | None = None

@router.post("/register")
async def register(req: RegisterRequest):
    # Dummy user registration
    user_id = str(uuid.uuid4())
    return {
        "user_id": user_id,
        "email": req.email,
        "name": req.name
    }

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Dummy login for MVP integration
    if form_data.username and form_data.password:
        token = create_user_token("demo-user")
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid credentials")
