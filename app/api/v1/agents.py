from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from ...db.database import get_db
from ...services import agent_service
from ...services.nl_agent_builder import nl_agent_builder
from ...services.auto_optimizer import auto_optimizer
from ...schemas.agent_schema import AgentCreate, AgentResponse

from ..deps import get_current_user
from ...models.user import User
from ...models.task import Task
from ...core.rbac import requires_role, Role, admin_only, orchestrator_plus
from ...services.guardrail_service import guardrail_service
from sqlalchemy.future import select

class NLBuilderRequest(BaseModel):
    prompt: str

router = APIRouter()

@router.get("/", response_model=List[AgentResponse])
async def get_agents(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only return agents owned by the current user
    return await agent_service.list_agents(db, skip=skip, limit=limit, owner_id=current_user.user_id)

@router.post("/", response_model=AgentResponse, dependencies=[Depends(orchestrator_plus())])
async def create_agent(
    agent: AgentCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure the owner_id matches the current user
    agent.owner_id = current_user.user_id
    return await agent_service.register_agent(db, agent)

@router.post("/register", response_model=AgentResponse, dependencies=[Depends(orchestrator_plus())])
async def register_agent(
    agent: AgentCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent.owner_id = current_user.user_id
    return await agent_service.register_agent(db, agent)

@router.post("/create-from-prompt", response_model=AgentResponse, dependencies=[Depends(orchestrator_plus())])
async def create_agent_from_prompt(
    req: NLBuilderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Build and register a new agent using a natural language prompt.
    """
    agent_config = await nl_agent_builder.build_from_prompt(req.prompt, current_user.user_id)
    if not agent_config:
        raise HTTPException(status_code=400, detail="Failed to parse agent configuration from prompt.")
    
    return await agent_service.register_agent(db, agent_config)

@router.get("/my", response_model=List[AgentResponse])
async def get_my_agents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await agent_service.list_agents(db, owner_id=current_user.user_id)

@router.get("/builtin")
async def get_builtin_agents(db: AsyncSession = Depends(get_db)):
    return await agent_service.get_builtin_agents_from_db(db)

@router.get("/templates")
async def get_agent_templates():
    from ...services.agent_service import BUILTIN_AGENTS
    return BUILTIN_AGENTS

@router.get("/{agent_id}/export")
async def export_agent(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent = await agent_service.get_agent(db, agent_id, current_user.user_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {
        "name": f"{agent.name} (Imported)",
        "role": agent.role,
        "description": agent.description,
        "model_name": agent.model_name,
        "personality_config": agent.personality_config,
        "scopes": agent.scopes.split(",") if agent.scopes else []
    }

@router.post("/import", response_model=AgentResponse, dependencies=[Depends(orchestrator_plus())])
async def import_agent(
    agent: AgentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent.owner_id = current_user.user_id
    return await agent_service.register_agent(db, agent)

@router.get("/{agent_id}/optimization-history")
async def get_agent_optimization_history(
    agent_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Fetch the history of prompt optimizations for an agent.
    """
    return await auto_optimizer.get_optimization_history(agent_id)

@router.post("/{agent_id}/optimize", dependencies=[Depends(orchestrator_plus())])
async def trigger_agent_optimization(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually trigger an AI optimization for an agent's prompt.
    """
    # Fetch recent history
    from ...services import task_service
    history = await task_service.list_tasks(db, user_id=current_user.user_id, limit=20)
    # Filter for this agent if needed, or pass agent_id to list_tasks if supported
    history_dicts = [{"payload": h.payload, "status": h.status} for h in history if h.agent_id == agent_id]
    
    new_prompt = await auto_optimizer.optimize_agent(agent_id, history_dicts)
    if not new_prompt:
        raise HTTPException(status_code=400, detail="Optimization failed or no improvements found.")
        
    return {"new_prompt": new_prompt}

@router.get("/leaderboard")
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    return await agent_service.get_leaderboard(db)


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent = await agent_service.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this agent")
    return agent

@router.patch("/{agent_id}", response_model=AgentResponse, dependencies=[Depends(orchestrator_plus())])
async def update_agent(
    agent_id: str, 
    updates: dict, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify ownership before update
    agent = await agent_service.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this agent")
        
    return await agent_service.update_agent(db, agent_id, current_user.user_id, updates)

@router.delete("/{agent_id}", dependencies=[Depends(admin_only())])
async def delete_agent(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enterprise Safe-Delete: Only admins can decommission agents from the fleet.
    """
    success = await agent_service.delete_agent(db, agent_id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete agent. Verify ownership or status.")
    return {"status": "decommissioned", "agent_id": agent_id}

@router.get("/{agent_id}/metrics")
async def get_agent_metrics(
    agent_id: str, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent = await agent_service.get_agent(db, agent_id, current_user.user_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    success_rate = (agent.successful_tasks / agent.total_tasks) if agent.total_tasks > 0 else 0.0
    return {"success_rate": success_rate * 100, "total_tasks": agent.total_tasks}


@router.get("/{agent_id}/history")
async def get_agent_history(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Task).filter(Task.agent_id == agent_id, Task.user_id == current_user.user_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/guardian/validate")
async def guardian_validate(req: dict):
    content = req.get("content", "")
    return guardrail_service.validate_content(content)
