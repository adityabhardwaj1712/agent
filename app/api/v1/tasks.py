from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from ...db.database import get_db
from ...services import task_service
from ...schemas.task_schema import TaskCreate, TaskResponse, TaskStatusResponse, GoalCreate, GoalResponse
from ..deps import get_current_user
from ...models.user import User
import asyncio

router = APIRouter()

@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await task_service.list_tasks(db, skip=skip, limit=limit)

@router.post("/", response_model=TaskResponse)
async def create_task(
    task: TaskCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from ...services.event_bus import event_bus
    result = await task_service.send_task(db, task, user_id=current_user.user_id)
    await event_bus.publish("task_created", {"type": "task", "task_id": result.task_id})
    return result

@router.get("/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await task_service.get_task_status(db, task_id, user_id=current_user.user_id)

from pydantic import BaseModel
class RootCauseResponse(BaseModel):
    analysis: str
    fix_suggestion: str

@router.get("/{task_id}/root-cause", response_model=RootCauseResponse)
async def analyze_task_failure(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from ...services.trace_service import get_traces_for_task
    from ...services.model_router import select_model, call_provider
    import json
    
    task_status = await task_service.get_task_status(db, task_id, user_id=current_user.user_id)
    if not task_status:
        raise HTTPException(status_code=404, detail="Task not found")
        
    traces = await get_traces_for_task(db, task_id, limit=5)
    trace_data = json.dumps([{"step": t.step, "input": getattr(t, 'input_data', None), "output": getattr(t, 'output_data', None)} for t in traces])
    
    prompt = f"Analyze the following failed task and its execution traces to determine the root cause and suggest a fix. Task description: {task_status.description}\n\nTraces: {trace_data}"
    system = "You are an expert DevOps engineer and AI RCA (Root Cause Analyzer). Return a literal JSON exactly matching schema: {'analysis': 'str', 'fix_suggestion': 'str'} without any markdown formatting."
    
    choice = select_model("analysis")
    content, _, _ = await call_provider(choice=choice, prompt=prompt, context=system)
    
    try:
        data = json.loads(content.replace("```json", "").replace("```", "").strip())
        return RootCauseResponse(analysis=data.get('analysis', ''), fix_suggestion=data.get('fix_suggestion', ''))
    except:
        return RootCauseResponse(analysis="Failed to parse LLM analysis regarding the error.", fix_suggestion="Please check the raw logs or traces manually.")

@router.post("/goals", response_model=GoalResponse)
async def create_goal(
    goal_in: GoalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from ...services.autonomous_orchestrator import autonomous_orchestrator
    from ...models.goal import Goal
    
    new_goal = Goal(
        user_id=current_user.user_id,
        description=goal_in.description,
        target_outcome=goal_in.target_outcome
    )
    db.add(new_goal)
    await db.commit()
    await db.refresh(new_goal)
    
    asyncio.create_task(autonomous_orchestrator.run_goal(new_goal.goal_id))
    
    return new_goal

@router.get("/goals", response_model=List[GoalResponse])
async def get_goals(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from ...services.task_service import list_goals
    return await list_goals(db, user_id=current_user.user_id, skip=skip, limit=limit)

@router.get("/goals/{goal_id}")
async def get_goal_status(
    goal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from ...services.task_service import get_goal_status
    status = await get_goal_status(db, goal_id, user_id=current_user.user_id)
    if not status:
        raise HTTPException(status_code=404, detail="Goal not found")
    return status
