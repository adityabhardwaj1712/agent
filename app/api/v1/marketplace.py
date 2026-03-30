from fastapi import APIRouter

router = APIRouter()
from typing import Any
from pydantic import BaseModel

class DummyReq(BaseModel):
    pass

@router.get("/templates")
async def templates():
    return [
        {"id": "t1", "name": "SEO Expert", "role": "Marketing", "desc": "Optimize your content for search engines", "price": 0.05, "stars": 4.9},
        {"id": "t2", "name": "LinkedIn Content Bot", "role": "Social", "desc": "Automatic post generation and engagement", "price": 0.10, "stars": 4.7},
        {"id": "t3", "name": "GitHub Automator", "role": "DevOps", "desc": "PR review and auto-commit cleanup", "price": 0.15, "stars": 4.8},
    ]

@router.get("/featured")
async def featured():
    return [
        {"id": "f1", "name": "Autonomous Sales Agent", "role": "Sales", "desc": "Handles end-to-end outreach and lead conversion", "price": 0.50, "stars": 5.0},
        {"id": "f2", "name": "Fleet Commander", "role": "Orchestration", "desc": "Manage multi-agent collaboration with ease", "price": 1.00, "stars": 4.9},
    ]

