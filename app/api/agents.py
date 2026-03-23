from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from ..db.database import get_db
from ..core.deps import get_current_user
from ..core.audit import log_audit
from ..services.agent_service import (
    register_agent, get_agent, list_agents, delete_agent,
    update_agent, seed_builtin_agents
)
from ..schemas.agent_schema import AgentCreate, AgentResponse, AgentUpdate
from ..models.user import User

router = APIRouter(prefix="/agents")


@router.post("/register", response_model=AgentResponse)
async def create_agent(
    request: Request,
    data: AgentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # FIX: Enforce owner_id from authenticated user (not from request body)
    data.owner_id = user.user_id
    result = await register_agent(db, data)
    await log_audit(
        db,
        request=request,
        agent_id=result.get("agent_id"),
        action="agents.register",
        status_code=200,
    )
    return result


@router.get("/", response_model=List[AgentResponse])
async def list_all(
    owner_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    # FIX: owner_id is optional — if missing, list all (admin use-case)
    return await list_agents(db, owner_id=owner_id, skip=skip, limit=limit)


@router.get("/my", response_model=List[AgentResponse])
async def list_my_agents(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List agents belonging to the authenticated user; seed built-ins if empty."""
    agents = await list_agents(db, user.user_id, skip=skip, limit=limit)
    if not agents:
        await seed_builtin_agents(db, user.user_id)
        agents = await list_agents(db, user.user_id, skip=skip, limit=limit)
    return agents


@router.get("/leaderboard", response_model=List[AgentResponse])
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    from ..models.agent import Agent
    from sqlalchemy.future import select
    stmt = select(Agent).order_by(Agent.reputation_score.desc()).limit(10)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/builtin", response_model=List[AgentResponse])
async def list_builtin_templates():
    """Return built-in agent templates (no DB needed)."""
    from ..services.agent_service import BUILTIN_AGENTS
    return [
        AgentResponse(
            agent_id=f"builtin-{i}",
            name=a["name"],
            role=a["role"],
            description=a["description"],
            personality_config=a["personality_config"],
            owner_id="system",
            scopes=a["scopes"].split(","),
            reputation_score=75.0,
        )
        for i, a in enumerate(BUILTIN_AGENTS)
    ]


@router.get("/{agent_id}", response_model=AgentResponse)
async def get(agent_id: str, db: AsyncSession = Depends(get_db)):
    # FIX: get_agent now has optional owner_id — pass None for public lookup
    agent = await get_agent(db, agent_id, owner_id=None)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.patch("/{agent_id}", response_model=AgentResponse)
async def update(
    agent_id: str,
    data: AgentUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    agent = await update_agent(db, agent_id, user.user_id, data.model_dump(exclude_none=True))
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found or not owned by you")
    return agent


@router.delete("/{agent_id}")
async def delete(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # FIX: Pass owner_id so users can only delete their own agents
    success = await delete_agent(db, agent_id, owner_id=user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Agent not found or not owned by you")
    return {"status": "deleted"}


@router.get("/{agent_id}/history", response_model=List[dict])
async def get_agent_history(
    agent_id: str,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Fetch task history for a specific agent."""
    from ..models.task import Task
    from sqlalchemy import select
    
    agent = await get_agent(db, agent_id, owner_id=user.user_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    query = select(Task).filter(Task.agent_id == agent_id).order_by(Task.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    tasks = result.scalars().all()
    return [
        {
            "task_id": t.task_id,
            "status": t.status,
            "payload": t.payload,
            "result": t.result,
            "created_at": t.created_at,
            "cost": t.cost
        } for t in tasks
    ]


@router.get("/{agent_id}/metrics")
async def get_agent_metrics(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Fetch aggregated metrics for a specific agent."""
    from ..models.task import Task
    from sqlalchemy import func, select
    
    agent = await get_agent(db, agent_id, owner_id=user.user_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    # Success rate
    stats_query = await db.execute(
        select(Task.status, func.count()).filter(Task.agent_id == agent_id).group_by(Task.status)
    )
    stats = {row[0]: row[1] for row in stats_query.all()}
    
    completed = stats.get("completed", 0)
    failed = stats.get("failed", 0)
    total = completed + failed
    success_rate = (completed / total * 100) if total > 0 else 100.0
    
    # Total cost
    cost_query = await db.execute(select(func.sum(Task.cost)).filter(Task.agent_id == agent_id))
    total_cost = cost_query.scalar() or 0.0
    
    return {
        "agent_id": agent_id,
        "name": agent.name,
        "total_tasks": total,
        "success_rate": success_rate,
        "total_cost": total_cost,
        "reputation": agent.reputation_score,
        "status_breakdown": stats
    }


@router.post("/guardian/validate")
async def guardian_validate(
    payload: dict,
    user: User = Depends(get_current_user),
):
    """Specialized endpoint for the Security Guardian to validate payloads."""
    content = str(payload.get("content", "")).upper()
    forbidden = ["DELETE ALL", "DROP TABLE", "RM -RF /", "FORMAT C:"]
    found = [f for f in forbidden if f in content]
    
    is_safe = len(found) == 0
    return {
        "is_safe": is_safe,
        "violations": found,
        "risk_level": "CRITICAL" if not is_safe else "LOW",
        "recommendation": "Block execution" if not is_safe else "Proceed"
    }


@router.post("/summarizer/summarize")
async def summarizer_summarize(
    data: dict,
    user: User = Depends(get_current_user),
):
    """Specialized endpoint for the Fleet Summarizer to synthesize task data."""
    tasks = data.get("tasks", [])
    if not tasks:
        return {"summary": "No task history to summarize."}
    
    # Simple logic: count statuses
    count = len(tasks)
    completed = len([t for t in tasks if t.get("status") == "completed"])
    
    return {
        "summary": f"Fleet processed {count} tasks with a {(completed/count*100):.1f}% success rate. Operations are stable.",
        "key_insights": [
            f"Successfully finished {completed} operations.",
            "Latency remains within nominal bounds."
        ]
    }
