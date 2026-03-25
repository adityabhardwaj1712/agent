from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from ...db.database import get_db
from ...services import memory_service
from ...schemas.memory_schema import MemoryCreate, MemoryResponse
from ...api.deps import get_current_user
from ...models.user import User

router = APIRouter()

@router.post("/", response_model=dict)
async def create_memory(
    data: MemoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Store a new memory fragment for an agent.
    """
    return await memory_service.write_memory(db, data, current_user.user_id)

@router.get("/search", response_model=List[MemoryResponse])
async def search_memories(
    agent_id: str,
    query: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search for semantically similar memories using pgvector.
    """
    # Note: In a real production system, we'd verify agent ownership here.
    memories = await memory_service.search_memory(db, agent_id, query)
    return memories
