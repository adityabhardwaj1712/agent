from fastapi import APIRouter

router = APIRouter()
from typing import Any
from pydantic import BaseModel

class DummyReq(BaseModel):
    pass

@router.get("/logs")
async def logs():
    return []

