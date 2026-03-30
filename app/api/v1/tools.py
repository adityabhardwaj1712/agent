from fastapi import APIRouter

router = APIRouter()
from typing import Any
from pydantic import BaseModel

class DummyReq(BaseModel):
    pass

@router.get("/")
async def list_tools():
    return [
        {"id": "google_search", "name": "Google Search", "category": "Web", "desc": "Live web search access", "icon": "🌐"},
        {"id": "python_interpreter", "name": "Python Sandbox", "category": "Code", "desc": "Safe code execution", "icon": "🐍"},
        {"id": "web_fetch", "name": "Browser", "category": "Web", "desc": "Extract content from URLs", "icon": "📄"},
        {"id": "sql_query", "name": "DB Explorer", "category": "Data", "desc": "Query structured databases", "icon": "🗄️"},
    ]

