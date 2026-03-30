from fastapi import APIRouter

router = APIRouter()
from typing import Any
from pydantic import BaseModel

class DummyReq(BaseModel):
    pass

@router.get("/circuits")
async def circuits():
    return [
        {"agent_id": "WebResearcher", "status": "closed", "fail_count": 0, "last_failure": None},
        {"agent_id": "CodeHelper", "status": "closed", "fail_count": 0, "last_failure": None},
        {"agent_id": "DataAnalyst", "status": "open", "fail_count": 5, "last_failure": "2026-03-30T10:00:00"},
    ]

