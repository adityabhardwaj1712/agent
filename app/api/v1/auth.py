from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ...core.auth_service import create_user_token

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(req: LoginRequest):
    # Dummy login for MVP integration
    if req.email and req.password:
        token = create_user_token("demo-user")
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid credentials")
