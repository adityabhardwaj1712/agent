from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
import datetime
from ...db.database import get_db
from ...models.agent import Agent
from ...models.task import Task
from ...models.approval import ApprovalRequest
from ...models.trace import Trace

from ...api.deps import get_current_user
from ...models.user import User

router = APIRouter()

@router.get("/summary")
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Active Agents count
    agent_count = await db.scalar(select(func.count(Agent.agent_id)))
    
    # 2. Tasks stats
    total_tasks = await db.scalar(select(func.count(Task.task_id)))
    completed_tasks = await db.scalar(select(func.count(Task.task_id)).filter(Task.status == "completed"))
    failed_tasks = await db.scalar(select(func.count(Task.task_id)).filter(Task.status == "failed"))
    
    error_rate = 0.0
    if total_tasks > 0:
        error_rate = failed_tasks / total_tasks
    
    # 3. Avg Latency (proxy from execution_time_ms in Task table)
    avg_latency = await db.scalar(select(func.avg(Task.execution_time_ms))) or 0
    
    # 4. Pending Approvals (for Sidebar badge)
    pending_approvals = await db.scalar(select(func.count(ApprovalRequest.request_id)).filter(ApprovalRequest.status == "pending"))
    
    # 5. Recent Traces (for Dashboard Collaboration visual)
    recent_traces_count = await db.scalar(select(func.count(Trace.trace_id)))

    return {
        "active_agents": agent_count or 0,
        "tasks_completed": completed_tasks or 0,
        "total_tasks": total_tasks or 0,
        "pending_approvals": pending_approvals or 0,
        "error_rate": error_rate,
        "avg_latency": round(float(avg_latency), 1),
        "active_events": recent_traces_count or 0
    }

@router.get("/metrics")
async def get_metrics(current_user: User = Depends(get_current_user)):
    # Placeholder for more detailed metrics if needed
    return {"status": "ok"}

