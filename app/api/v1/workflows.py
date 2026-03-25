from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ...db.database import get_db
from ...models.workflow import WorkflowDefinition, WorkflowRun
from pydantic import BaseModel
import datetime

router = APIRouter()

class WorkflowSchema(BaseModel):
    name: str
    description: str | None = None
    definition: dict

class WorkflowResponse(WorkflowSchema):
    id: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[WorkflowResponse])
async def list_workflows(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkflowDefinition).order_by(WorkflowDefinition.updated_at.desc()))
    return result.scalars().all()

@router.post("/")
async def save_workflow(wf: WorkflowSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkflowDefinition).filter(WorkflowDefinition.name == wf.name))
    existing = result.scalars().first()
    
    if existing:
        existing.definition = wf.definition
        existing.description = wf.description
        existing.updated_at = datetime.datetime.now(datetime.UTC)
    else:
        new_wf = WorkflowDefinition(
            name=wf.name,
            description=wf.description,
            definition=wf.definition,
            user_id="demo-user"
        )
        db.add(new_wf)
    
    await db.commit()
    return {"status": "saved"}

@router.post("/run")
async def run_workflow(wf: dict, db: AsyncSession = Depends(get_db)):
    # Placeholder for actual workflow execution logic
    new_run = WorkflowRun(
        workflow_name=wf.get("name", "unknown"),
        status="running",
        user_id="demo-user"
    )
    db.add(new_run)
    await db.commit()
    return {"status": "started", "run_id": new_run.run_id}


@router.get("/{name}", response_model=WorkflowResponse)
async def get_workflow(name: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkflowDefinition).filter(WorkflowDefinition.name == name))
    wf = result.scalars().first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf

