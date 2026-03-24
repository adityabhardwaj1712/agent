from fastapi import APIRouter

router = APIRouter()
from typing import Any
from pydantic import BaseModel

class DummyReq(BaseModel):
    pass

@router.get("/templates")
async def templates():
    return []

@router.get("/featured")
async def featured():
    return []

