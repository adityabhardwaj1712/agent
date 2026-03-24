from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from ...db.database import get_db
from ...services import task_service
from ...schemas.task_schema import TaskCreate, TaskResponse, TaskStatusResponse

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
