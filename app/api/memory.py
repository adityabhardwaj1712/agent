from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
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
def write(
    request: Request,
    data: MemoryCreate,
    db: Session = Depends(get_db),
    current: CurrentAgent = Depends(require_scopes([Scope.WRITE_MEMORY])),
):
    result = write_memory(db, data)
    MEMORY_WRITES_TOTAL.inc()
    log_audit(db, request=request, agent_id=current.agent_id, action="memory.write", status_code=200)
    return result

@router.get("/search", response_model=List[MemoryResponse])
def search(
    request: Request,
    q: str,
    agent_id: str,
    db: Session = Depends(get_db),
    current: CurrentAgent = Depends(require_scopes([Scope.READ_MEMORY])),
):
    result = search_memory(db, agent_id, q)
    MEMORY_SEARCHES_TOTAL.inc()
    log_audit(db, request=request, agent_id=current.agent_id, action="memory.search", status_code=200)
    return result
