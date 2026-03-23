from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel
import datetime

from ..db.database import get_db
from ..core.deps import get_current_user
from ..models.user import User
from ..models.agent import Agent
from ..models.task import Task
from sqlalchemy.future import select
from sqlalchemy import func

router = APIRouter(prefix="/query")

class QueryRequest(BaseModel):
    prompt: str

class QueryResponse(BaseModel):
    answer: str
    data: Optional[dict] = None
    type: str # "text", "table", "chart"

@router.post("/fleet", response_model=QueryResponse)
async def query_fleet(
    data: QueryRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Simple keyword-based natural language query engine for the agent fleet.
    In a real app, this would use an LLM with tool-calling.
    """
    prompt = data.prompt.lower()
    
    # 1. Query: "How many agents are there?"
    if "how many agents" in prompt or "total agents" in prompt:
        res = await db.execute(select(func.count(Agent.agent_id)))
        count = res.scalar() or 0
        return QueryResponse(
            answer=f"There are currently {count} agents in your fleet.",
            data={"count": count},
            type="text"
        )
    
    # 2. Query: "What is the total cost?" or "Total burn"
    if "total cost" in prompt or "total burn" in prompt:
        res = await db.execute(select(func.sum(Task.cost)))
        total = res.scalar() or 0.0
        return QueryResponse(
            answer=f"The total operational cost for all tasks is ${total:.4f}.",
            data={"total_cost": total},
            type="text"
        )

    # 3. Query: "Show me my agents"
    if "show my agents" in prompt or "list my agents" in prompt:
        res = await db.execute(select(Agent).filter(Agent.owner_id == user.user_id).limit(5))
        agents = res.scalars().all()
        return QueryResponse(
            answer=f"Found {len(agents)} agents belonging to you.",
            data={"agents": [{"id": a.agent_id, "name": a.name, "role": a.role} for a in agents]},
            type="table"
        )

    # 4. Query: "Most active agent"
    if "most active" in prompt or "best agent" in prompt:
        res = await db.execute(select(Agent).order_by(Agent.total_tasks.desc()).limit(1))
        agent = res.scalar()
        if agent:
            return QueryResponse(
                answer=f"The most active agent is {agent.name} with {agent.total_tasks} tasks.",
                data={"agent_id": agent.agent_id, "name": agent.name, "tasks": agent.total_tasks},
                type="text"
            )

    # Fallback
    return QueryResponse(
        answer="I'm not sure how to answer that yet. Try asking 'How many agents are there?' or 'Total cost?'.",
        type="text"
    )
