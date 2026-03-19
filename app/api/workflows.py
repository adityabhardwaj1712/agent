from fastapi import APIRouter, Depends
from ..core.deps import get_current_user
from ..models.user import User
from ..services.dag_engine import WorkflowEngine, WorkflowDef, Node, Edge
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

router = APIRouter(prefix="/workflows", tags=["workflows"])

class WorkflowRunRequest(BaseModel):
    name: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    initial_state: Dict[str, Any] = {}

@router.post("/run")
async def run_workflow(
    body: WorkflowRunRequest,
    current_user: User = Depends(get_current_user),
):
    wf = WorkflowDef(
        name=body.name,
        nodes=[Node(**n) for n in body.nodes],
        edges=[Edge(**e) for e in body.edges],
    )
    engine = WorkflowEngine()
    result = await engine.run(wf, initial_state=body.initial_state, user_id=current_user.user_id)
    return result
