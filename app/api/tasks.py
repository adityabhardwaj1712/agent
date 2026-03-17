from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from ..core.audit import log_audit
from ..core.deps import require_scopes
from ..core.scopes import Scope, CurrentAgent
from ..db.database import get_db
from ..services.task_service import get_task_status, send_task
from ..schemas.task_schema import TaskCreate, TaskResponse, TaskStatusResponse
from ..core.metrics import TASKS_SUBMITTED_TOTAL, TASK_STATUS_TOTAL

router = APIRouter(prefix="/tasks")

@router.post("/run", response_model=TaskResponse)
async def run(
    request: Request,
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current: CurrentAgent = Depends(require_scopes([Scope.RUN_TASKS])),
):
    result = await send_task(db, data)
    TASKS_SUBMITTED_TOTAL.inc()
    await log_audit(db, request=request, agent_id=current.agent_id, action="tasks.run", status_code=200)
    return result


@router.get("/{task_id}", response_model=TaskStatusResponse)
async def status(
    request: Request,
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current: CurrentAgent = Depends(require_scopes([Scope.RUN_TASKS])),
):
    result = await get_task_status(db, task_id)
    TASK_STATUS_TOTAL.labels(status=result.get("status", "unknown")).inc()
    await log_audit(db, request=request, agent_id=current.agent_id, action="tasks.status", status_code=200)
    return result
