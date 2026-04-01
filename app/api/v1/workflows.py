from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from ...db.database import get_db
from ...models.workflow import WorkflowDefinition
from ...api.deps import get_current_user
from ...models.user import User
from pydantic import BaseModel
from typing import List, Any, Optional

router = APIRouter()

class WorkflowSave(BaseModel):
    name: str
    description: Optional[str] = None
    definition: Any # The React Flow nodes and edges JSON

@router.post("/")
async def save_workflow(
    wf: WorkflowSave,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if workflow with same name exists for this user
    existing = await db.execute(
        select(WorkflowDefinition).filter(
            WorkflowDefinition.name == wf.name,
            WorkflowDefinition.user_id == current_user.user_id
        )
    )
    obj = existing.scalar_one_or_none()
    
    if obj:
        obj.definition = wf.definition
        obj.description = wf.description
    else:
        obj = WorkflowDefinition(
            name=wf.name,
            description=wf.description,
            definition=wf.definition,
            user_id=current_user.user_id
        )
        db.add(obj)
    
    await db.commit()
    return {"status": "saved", "id": obj.id, "name": obj.name}

@router.get("/")
async def list_workflows(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(WorkflowDefinition).filter(WorkflowDefinition.user_id == current_user.user_id)
    )
    return result.scalars().all()

@router.get("/{wf_id}")
async def get_workflow(
    wf_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(WorkflowDefinition).filter(
            WorkflowDefinition.id == wf_id,
            WorkflowDefinition.user_id == current_user.user_id
        )
    )
    wf = result.scalar_one_or_none()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf

@router.delete("/{wf_id}")
async def delete_workflow(
    wf_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await db.execute(
        delete(WorkflowDefinition).filter(
            WorkflowDefinition.id == wf_id,
            WorkflowDefinition.user_id == current_user.user_id
        )
    )
    await db.commit()
    return {"status": "deleted"}
