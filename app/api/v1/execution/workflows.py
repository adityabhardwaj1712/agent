from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
import json
import uuid
from app.db.database import get_db
from app.models.workflow import WorkflowDefinition
from app.models.goal import Goal
from app.api.deps import get_current_user
from app.models.user import User
from app.services.autonomous_orchestrator import autonomous_orchestrator
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

class WorkflowRun(BaseModel):
    name: str
    nodes: List[Any]
    edges: List[Any]

@router.post("/run")
async def run_workflow(
    wf: WorkflowRun,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Execute a workflow graph by converting it to an autonomous Goal mission.
    """
    # Create a new Goal from this workflow run
    new_goal = Goal(
        goal_id=str(uuid.uuid4()),
        user_id=current_user.user_id,
        description=f"Workflow Run: {wf.name}",
        target_outcome="Workflow completion",
        workflow_type="dag",
        workflow_json=json.dumps({"nodes": wf.nodes, "edges": wf.edges}),
        status="active"
    )
    db.add(new_goal)
    await db.commit()
    
    # Trigger orchestrator in background
    background_tasks.add_task(autonomous_orchestrator.run_dag_goal, new_goal.goal_id)
    
    return {
        "status": "started", 
        "goal_id": new_goal.goal_id,
        "message": "Workflow converted to Goal mission and dispatched to SWARM."
    }

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
