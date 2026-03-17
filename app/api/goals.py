from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from ..db.database import get_db
from ..schemas.task_schema import GoalCreate, GoalResponse
from ..services.goal_service import create_goal, get_goal, list_goals
from ..core.deps import require_scopes
from ..core.scopes import Scope, CurrentAgent

router = APIRouter(prefix="/goals", tags=["Goals"])

@router.post("/", response_model=GoalResponse)
async def create(
    data: GoalCreate,
    db: AsyncSession = Depends(get_db),
    current: CurrentAgent = Depends(require_scopes([Scope.RUN_TASKS]))
):
    return await create_goal(db, data, owner_id=current.agent_id)

@router.get("/", response_model=List[GoalResponse])
async def list_all(
    db: AsyncSession = Depends(get_db),
    current: CurrentAgent = Depends(require_scopes([Scope.RUN_TASKS]))
):
    return await list_goals(db)

@router.get("/{goal_id}", response_model=GoalResponse)
async def get(
    goal_id: str,
    db: AsyncSession = Depends(get_db),
    current: CurrentAgent = Depends(require_scopes([Scope.RUN_TASKS]))
):
    goal = await get_goal(db, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal
