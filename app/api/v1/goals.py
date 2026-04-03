from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Any
from pydantic import BaseModel
import uuid

from ...db.database import get_db
from ...models.goal import Goal
from ...models.task import Task
from ...services.autonomous_orchestrator import autonomous_orchestrator
from ...services.goal_orchestrator import goal_orchestrator
from ..deps import get_current_user
from ...models.user import User


router = APIRouter()

class GoalCreate(BaseModel):
    description: str
    target_outcome: Optional[str] = None
    workflow_type: str = "linear" # linear, dag

class GoalResponse(BaseModel):
    goal_id: str
    description: str
    status: str
    workflow_type: str
    workflow_json: Optional[str] = None

@router.post("/", response_model=GoalResponse)
async def create_goal(
    req: GoalCreate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_goal = Goal(
        goal_id=str(uuid.uuid4()),
        user_id=current_user.user_id,
        description=req.description,
        target_outcome=req.target_outcome,
        workflow_type=req.workflow_type,
        status="active"
    )
    db.add(new_goal)
    await db.commit()
    await db.refresh(new_goal)

    if req.workflow_type == "dag":
        background_tasks.add_task(autonomous_orchestrator.run_dag_goal, new_goal.goal_id)
    else:
        background_tasks.add_task(autonomous_orchestrator.run_goal, new_goal.goal_id)

    return new_goal

@router.get("/", response_model=List[GoalResponse])
async def list_goals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Goal).order_by(Goal.created_at.desc()))
    return result.scalars().all()

@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Goal).filter(Goal.goal_id == goal_id))
    goal = result.scalars().first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

@router.get("/{goal_id}/tasks")
async def get_goal_tasks(goal_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get all tasks/steps related to a specific mission (goal).
    """
    result = await db.execute(
        select(Task)
        .filter(Task.goal_id == goal_id)
        .order_by(Task.created_at.asc())
    )
    return result.scalars().all()


