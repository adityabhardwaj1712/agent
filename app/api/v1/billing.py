from fastapi import APIRouter

router = APIRouter()
from typing import Any
from pydantic import BaseModel

class DummyReq(BaseModel):
    pass

@router.get("/subscription")
async def subscription():
    return []

@router.get("/usage")
async def usage():
    return []

