from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
import datetime
from app.db.database import get_db
from app.models.agent import Agent
from app.models.task import Task
from app.models.approval import ApprovalRequest
from app.models.trace import Trace

from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/summary")
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Active Agents count
    agent_count = await db.scalar(select(func.count(Agent.agent_id)).filter(Agent.owner_id == current_user.user_id))
    
    # 2. Tasks stats
    total_tasks = await db.scalar(select(func.count(Task.task_id)).filter(Task.user_id == current_user.user_id))
    completed_tasks = await db.scalar(select(func.count(Task.task_id)).filter(Task.status == "completed", Task.user_id == current_user.user_id))
    failed_tasks = await db.scalar(select(func.count(Task.task_id)).filter(Task.status == "failed", Task.user_id == current_user.user_id))
    
    error_rate = 0.0
    if total_tasks > 0:
        error_rate = failed_tasks / total_tasks
    
    # 3. Avg Latency (proxy from execution_time_ms in Task table)
    avg_latency = await db.scalar(select(func.avg(Task.execution_time_ms)).filter(Task.user_id == current_user.user_id)) or 0
    
    # 4. Pending Approvals (for Sidebar badge)
    pending_approvals = await db.scalar(
        select(func.count(ApprovalRequest.request_id))
        .join(Task, ApprovalRequest.task_id == Task.task_id)
        .filter(ApprovalRequest.status == "pending", Task.user_id == current_user.user_id)
    )
    
    # 5. Recent Traces (for Dashboard Collaboration visual)
    recent_traces_count = await db.scalar(
        select(func.count(Trace.trace_id))
        .join(Task, Trace.task_id == Task.task_id)
        .filter(Task.user_id == current_user.user_id)
    )

    # Success rate
    success_rate = 0.0
    if total_tasks > 0:
        success_rate = round(((completed_tasks or 0) / total_tasks) * 100, 1)

    # Total cost from Redis (if available)
    total_cost = 0.0
    try:
        from app.db.redis_client import get_async_redis_client
        import datetime as dt
        redis = await get_async_redis_client()
        period = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m")
        cost_val = await redis.get(f"usage:{current_user.user_id}:{period}:cost:global")
        total_cost = round(float(cost_val), 4) if cost_val else 0.0
    except Exception:
        pass

    # 6. System Load Proxy
    # Simplified: (Active Tasks / Agent Count) * 100
    active_tasks = await db.scalar(select(func.count(Task.task_id)).filter(Task.status == "running", Task.user_id == current_user.user_id)) or 0
    system_load = min(100, round((active_tasks / max(1, agent_count)) * 100, 1)) if agent_count else 0
    
    return {
        "active_agents": agent_count or 0,
        "tasks_completed": completed_tasks or 0,
        "total_tasks": total_tasks or 0,
        "pending_approvals": pending_approvals or 0,
        "error_rate": error_rate,
        "success_rate": success_rate,
        "total_cost": total_cost,
        "avg_latency": round(float(avg_latency), 1),
        "active_events": recent_traces_count or 0,
        "system_load": system_load
    }

@router.get("/timeseries")
async def get_timeseries(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get 24-hour task distribution for charts.
    """
    now = datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
    last_24h = now - datetime.timedelta(hours=24)
    
    # Query tasks by hour
    result = await db.execute(
        select(
            func.date_trunc('hour', Task.created_at).label('hour'),
            func.count(Task.task_id).label('count')
        )
        .filter(Task.created_at >= last_24h, Task.user_id == current_user.user_id)
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

@router.get("/success-heatmap")
async def get_success_heatmap(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns success vs failure distribution for the last 24 hours.
    """
    now = datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
    last_24h = now - datetime.timedelta(hours=24)
    
    # Successful tasks per hour
    success_res = await db.execute(
        select(
            func.date_trunc('hour', Task.created_at).label('hour'),
            func.count(Task.task_id).label('count')
        )
        .filter(Task.created_at >= last_24h, Task.status == "completed", Task.user_id == current_user.user_id)
        .group_by('hour')
        .order_by('hour')
    )
    
    # Failed tasks per hour
    fail_res = await db.execute(
        select(
            func.date_trunc('hour', Task.created_at).label('hour'),
            func.count(Task.task_id).label('count')
        )
        .filter(Task.created_at >= last_24h, Task.status == "failed", Task.user_id == current_user.user_id)
        .group_by('hour')
        .order_by('hour')
    )
    
    success_map = {r.hour: r.count for r in success_res.all()}
    fail_map = {r.hour: r.count for r in fail_res.all()}
    
    data = []
    current_ptr = last_24h.replace(minute=0, second=0, microsecond=0)
    
    for i in range(24):
        data.append({
            "hour": current_ptr.strftime("%H:00"),
            "success": success_map.get(current_ptr, 0),
            "failure": fail_map.get(current_ptr, 0)
        })
        current_ptr += datetime.timedelta(hours=1)
        
    return data


@router.get("/metrics")
async def get_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns detailed system metrics for the doctor and admin dashboard.
    """
    # 1. Task distribution by status
    status_counts = await db.execute(
        select(Task.status, func.count(Task.task_id))
        .filter(Task.user_id == current_user.user_id)
        .group_by(Task.status)
    )
    status_map = {row[0]: row[1] for row in status_counts.all()}
    
    # 2. Avg Latency for successful tasks
    avg_latency = await db.scalar(
        select(func.avg(Task.execution_time_ms))
        .filter(Task.status == "completed", Task.user_id == current_user.user_id)
    ) or 0
    
    # 3. Agent performance
    agent_perf = await db.execute(
        select(Agent.name, func.count(Task.task_id))
        .select_from(Agent)
        .join(Task, Agent.agent_id == Task.agent_id)
        .filter(Task.status == "completed", Task.user_id == current_user.user_id)
        .group_by(Agent.name)
        .order_by(func.count(Task.task_id).desc())
        .limit(5)
    )
    top_agents = [{"name": r[0], "tasks": r[1]} for r in agent_perf.all()]
    
    return {
        "tasks": {
            "completed": status_map.get("completed", 0),
            "failed": status_map.get("failed", 0),
            "pending": status_map.get("pending", 0),
            "running": status_map.get("running", 0),
            "total": sum(status_map.values())
        },
        "performance": {
            "avg_latency_ms": round(float(avg_latency), 1),
            "top_agents": top_agents
        },
        "system_health": "stable"
    }

@router.get("/agent-health")
async def get_agent_health_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns success rate, avg duration, and failure trends per agent.
    """
    # Get all agents for this user
    agents_res = await db.execute(select(Agent).filter(Agent.owner_id == current_user.user_id))
    agents = agents_res.scalars().all()
    
    health_data = []
    for agent in agents:
        success_rate = (agent.successful_tasks / agent.total_tasks * 100) if agent.total_tasks > 0 else 0
        
        # Avg duration for this specific agent
        avg_dur = await db.scalar(
            select(func.avg(Task.execution_time_ms))
            .filter(Task.agent_id == agent.agent_id, Task.status == "completed")
        ) or 0
        
        # Recent failure trend (last 10 tasks)
        recent_tasks = await db.execute(
            select(Task.status)
            .filter(Task.agent_id == agent.agent_id)
            .order_by(Task.created_at.desc())
            .limit(10)
        )
        trends = [t[0] for t in recent_tasks.all()]
        failure_count = trends.count("failed")
        
        health_data.append({
            "agent_id": agent.agent_id,
            "name": agent.name,
            "success_rate": round(success_rate, 2),
            "avg_duration_ms": round(float(avg_dur), 1),
            "recent_failures": failure_count,
            "status": agent.status
        })
        
    return health_data

@router.get("/export")
async def export_data(
    format: str = "json", # json or csv
    type: str = "tasks", # tasks, traces, or audit
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export tasks, traces, or audit logs as CSV or JSON.
    """
    import io
    import csv
    import json
    from fastapi.responses import StreamingResponse, Response

    data = []
    filename = f"export_{type}_{datetime.datetime.now().strftime('%Y%m%d')}"

    if type == "tasks":
        res = await db.execute(select(Task).filter(Task.user_id == current_user.user_id))
        rows = res.scalars().all()
        data = [{"task_id": r.task_id, "status": r.status, "agent_id": r.agent_id, "created_at": r.created_at.isoformat()} for r in rows]
    elif type == "audit":
        from app.models.audit_log import AuditLog
        res = await db.execute(select(AuditLog).filter(AuditLog.user_id == current_user.user_id))
        rows = res.scalars().all()
        data = [{"log_id": r.log_id, "action": r.action_type, "timestamp": r.timestamp.isoformat()} for r in rows]
    
    if format == "csv":
        output = io.StringIO()
        if data:
            writer = csv.DictWriter(output, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
        )
    else:
        return Response(
            content=json.dumps(data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}.json"}
        )


