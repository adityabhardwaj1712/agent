from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from ..core.deps import require_scopes
from ..core.scopes import Scope, CurrentAgent
from ..core.audit import log_audit
from ..db.database import get_db
from ..services.memory_service import write_memory, search_memory
from ..schemas.memory_schema import MemoryCreate, MemoryResponse
from ..core.metrics import MEMORY_WRITES_TOTAL, MEMORY_SEARCHES_TOTAL

router = APIRouter(prefix="/memory")

@router.post("/write")
async def write(
    request: Request,
    data: MemoryCreate,
    db: AsyncSession = Depends(get_db),
    current: CurrentAgent = Depends(require_scopes([Scope.WRITE_MEMORY])),
):
    result = await write_memory(db, data)
    MEMORY_WRITES_TOTAL.inc()
    await log_audit(db, request=request, agent_id=current.agent_id, action="memory.write", status_code=200)
    return result

@router.get("/search", response_model=List[MemoryResponse])
async def search(
    request: Request,
    q: str,
    db: AsyncSession = Depends(get_db),
    current: CurrentAgent = Depends(require_scopes([Scope.READ_MEMORY])),
):
    # Enforce isolation: search only current agent's memories
    result = await search_memory(db, current.agent_id, q)
    MEMORY_SEARCHES_TOTAL.inc()
    await log_audit(db, request=request, agent_id=current.agent_id, action="memory.search", status_code=200)
    return result
