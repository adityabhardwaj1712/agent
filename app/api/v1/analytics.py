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

    # Success rate
    success_rate = 0.0
    if total_tasks > 0:
        success_rate = round(((completed_tasks or 0) / total_tasks) * 100, 1)

    # Total cost from Redis (if available)
    total_cost = 0.0
    try:
        from ...db.redis_client import get_async_redis_client
        import datetime as dt
        redis = await get_async_redis_client()
        period = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m")
        cost_val = await redis.get(f"usage:{current_user.user_id}:{period}:cost:global")
        total_cost = round(float(cost_val), 4) if cost_val else 0.0
    except Exception:
        pass

    return {
        "active_agents": agent_count or 0,
        "tasks_completed": completed_tasks or 0,
        "total_tasks": total_tasks or 0,
        "pending_approvals": pending_approvals or 0,
        "error_rate": error_rate,
        "success_rate": success_rate,
        "total_cost": total_cost,
        "avg_latency": round(float(avg_latency), 1),
        "active_events": recent_traces_count or 0
    }

@router.get("/timeseries")
async def get_timeseries(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get 24-hour task distribution for charts.
    """
    now = datetime.datetime.utcnow()
    last_24h = now - datetime.timedelta(hours=24)
    
    # Query tasks by hour
    result = await db.execute(
        select(
            func.date_trunc('hour', Task.created_at).label('hour'),
            func.count(Task.task_id).label('count')
        )
        .filter(Task.created_at >= last_24h)
        .group_by('hour')
        .order_by('hour')
    )
    
    rows = result.all()
    
    # Fill gaps for hours with no tasks
    data = []
    current_ptr = last_24h.replace(minute=0, second=0, microsecond=0)
    
    row_map = {r.hour: r.count for r in rows}
    
    for i in range(25):
        h_str = current_ptr.strftime("%H:%M")
        data.append({
            "time": h_str,
            "value": row_map.get(current_ptr, 0)
        })
        current_ptr += datetime.timedelta(hours=1)
        
    return data

@router.get("/fleet-health")
async def get_fleet_health(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns agent state distribution for fleet health donut chart.
    """
    total = await db.scalar(select(func.count(Agent.agent_id))) or 0
    
    # Count agents by status
    running = await db.scalar(
        select(func.count(Agent.agent_id)).filter(Agent.status == "running")
    ) or 0
    idle = await db.scalar(
        select(func.count(Agent.agent_id)).filter(Agent.status == "idle")
    ) or 0
    cooldown = await db.scalar(
        select(func.count(Agent.agent_id)).filter(Agent.status == "cooldown")
    ) or 0
    offline = await db.scalar(
        select(func.count(Agent.agent_id)).filter(Agent.status == "offline")
    ) or 0
    
    # Agents with other/unknown statuses count as idle
    other = total - running - idle - cooldown - offline
    idle += other
    
    return {
        "running": running,
        "idle": idle,
        "cooldown": cooldown,
        "offline": offline,
        "total": total
    }


