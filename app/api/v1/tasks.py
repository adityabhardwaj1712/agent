from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from ...db.database import get_db
from ...services import task_service
from ...schemas.task_schema import TaskCreate, TaskResponse, TaskStatusResponse, GoalCreate, GoalResponse
import asyncio

router = APIRouter()

@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db)
):
    return await task_service.list_tasks(db, skip=skip, limit=limit)

@router.post("/", response_model=TaskResponse)
async def create_task(
    task: TaskCreate, 
    db: AsyncSession = Depends(get_db)
):
    # For now, we use a dummy user_id until auth middleware is fully hooked
    return await task_service.send_task(db, task, user_id="demo-user")

@router.get("/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str, 
    db: AsyncSession = Depends(get_db)
):
    return await task_service.get_task_status(db, task_id, user_id="demo-user")

@router.post("/goals", response_model=GoalResponse)
async def create_goal(
    goal_in: GoalCreate,
    db: AsyncSession = Depends(get_db)
):
    from ...services.autonomous_orchestrator import autonomous_orchestrator
    from ...models.goal import Goal
    
    # 1. Create Goal Record
    new_goal = Goal(
        user_id="demo-user",
        description=goal_in.description,
        target_outcome=goal_in.target_outcome
    )
    db.add(new_goal)
    await db.commit()
    await db.refresh(new_goal)
    
    # 2. Trigger Autonomous Loop in background
    asyncio.create_task(autonomous_orchestrator.run_goal(new_goal.goal_id))
    
    return new_goal

@router.get("/goals", response_model=List[GoalResponse])
async def get_goals(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    from ...services.task_service import list_goals
    return await list_goals(db, user_id="demo-user", skip=skip, limit=limit)

@router.get("/goals/{goal_id}")
async def get_goal_status(
    goal_id: str,
    db: AsyncSession = Depends(get_db)
):
    from ...services.task_service import get_goal_status
    status = await get_goal_status(db, goal_id, user_id="demo-user")
    if not status:
        raise HTTPException(status_code=404, detail="Goal not found")
    return status
