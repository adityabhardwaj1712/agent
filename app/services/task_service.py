from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import json
import hashlib
import time
from loguru import logger

from ..models.task import Task
from ..models.agent import Agent
from ..schemas.task_schema import TaskCreate
from .billing_service import billing_service
from .orchestrator import orchestrator, Priority


# ─── Productivity Engine ──────────────────────────────────────────────────────

def _compute_task_hash(payload: str, agent_id: str = None) -> str:
    """Generate a deterministic hash for deduplication."""
    content = f"{payload or ''}|{agent_id or 'any'}"
    return hashlib.md5(content.encode()).hexdigest()


async def _check_dedup(db: AsyncSession, task_hash: str) -> Task | None:
    """Check if a completed task with same hash exists (deduplication)."""
    try:
        result = await db.execute(
            select(Task)
            .where(Task.task_hash == task_hash, Task.status == "completed")
            .order_by(Task.created_at.desc())
            .limit(1)
        )
        return result.scalars().first()
    except Exception as e:
        logger.warning(f"Dedup check failed (non-fatal): {e}")
        return None


async def _check_result_cache(payload: str) -> str | None:
    """Check Redis for cached task results."""
    try:
        from ..db.redis_client import get_async_redis_client
        redis = await get_async_redis_client()
        cache_key = f"task_cache:{hashlib.md5(payload.encode()).hexdigest()}"
        cached = await redis.get(cache_key)
        if cached:
            logger.info(f"Cache HIT for task payload")
            return cached.decode() if isinstance(cached, bytes) else cached
    except Exception as e:
        logger.debug(f"Cache check failed (non-fatal): {e}")
    return None


async def _set_result_cache(payload: str, result: str, ttl: int = 3600) -> None:
    """Cache a task result in Redis with TTL."""
    try:
        from ..db.redis_client import get_async_redis_client
        redis = await get_async_redis_client()
        cache_key = f"task_cache:{hashlib.md5(payload.encode()).hexdigest()}"
        await redis.setex(cache_key, ttl, result)
    except Exception as e:
        logger.debug(f"Cache set failed (non-fatal): {e}")


# ─── Smart Agent Selection ────────────────────────────────────────────────────

async def _select_best_agent(db: AsyncSession, user_id: str) -> Agent | None:
    """Pick the agent with the best performance-to-cost ratio."""
    try:
        result = await db.execute(
            select(Agent).where(Agent.owner_id == user_id)
        )
        agents = result.scalars().all()
        if not agents:
            return None

        def _score(a: Agent) -> float:
            total = (a.total_tasks or 0)
            if total == 0:
                return 50.0  # Default score for untested agents
            success_rate = (a.successful_tasks or 0) / max(total, 1)
            cost_penalty = min((a.base_cost or 0.01) * 10, 5.0)  # Normalize cost
            return (success_rate * 100) + (a.reputation_score or 50) - cost_penalty

        agents_sorted = sorted(agents, key=_score, reverse=True)
        best = agents_sorted[0]
        logger.info(f"Smart routing → selected agent '{best.name}' (score={_score(best):.1f})")
        return best
    except Exception as e:
        logger.warning(f"Smart routing failed, will use provided agent_id: {e}")
        return None


# ─── Core Task Service ────────────────────────────────────────────────────────

async def send_task(db: AsyncSession, data: TaskCreate, user_id: str):
    task_hash = _compute_task_hash(data.payload, data.agent_id)

    # 1. CHECK BILLING LIMITS
    if not await billing_service.check_limits(db, user_id, "tasks_per_month"):
        raise PermissionError("Plan task limit reached")

    # 2. DEDUPLICATION — skip if identical completed task exists
    existing = await _check_dedup(db, task_hash)
    if existing and existing.result:
        logger.info(f"Dedup HIT → returning cached task {existing.task_id}")
        return existing

    # 3. RESULT CACHE — check Redis for fast cached results
    cached_result = await _check_result_cache(data.payload or "")
    if cached_result:
        # Create a lightweight "cached" task record
        cached_task = Task(
            task_id=str(uuid.uuid4()),
            user_id=user_id,
            agent_id=data.agent_id,
            payload=data.payload,
            task_hash=task_hash,
            status="completed",
            result=cached_result,
            is_cached_result=True,
            priority_level=5,
        )
        db.add(cached_task)
        await db.commit()
        logger.info(f"Cache HIT → created instant task {cached_task.task_id}")
        return cached_task

    # 4. SMART AGENT SELECTION — auto-pick best agent if none specified
    agent_id = data.agent_id
    if not agent_id:
        best_agent = await _select_best_agent(db, user_id)
        if best_agent:
            agent_id = best_agent.agent_id

    # 5. PRIORITY ROUTING
    priority = Priority.NORMAL
    payload_lower = (data.payload or "").lower()
    if "urgent" in payload_lower or "critical" in payload_lower:
        priority = Priority.CRITICAL
    elif "high" in payload_lower:
        priority = Priority.HIGH
    elif "low" in payload_lower:
        priority = Priority.LOW

    # 6. ENQUEUE for async worker
    try:
        await orchestrator.enqueue_task(
            db=db,
            payload=data.payload,
            user_id=user_id,
            agent_id=agent_id,
            priority=priority,
            goal_id=data.goal_id,
            parent_task_id=data.parent_task_id,
            task_hash=task_hash,
        )
    except Exception as e:
        logger.error(f"Failed to enqueue task: {e}")
        raise e

    # 7. RECORD USAGE
    try:
        await billing_service.record_usage(user_id, "tasks")
    except Exception as e:
        logger.warning(f"Failed to record usage for user {user_id}: {e}")

    # 8. RETURN CREATED TASK
    try:
        res = await db.execute(
            select(Task)
            .where(Task.user_id == user_id)
            .order_by(Task.created_at.desc())
        )
        task = res.scalars().first()
        return task
    except Exception as e:
        logger.error(f"Failed to fetch created task: {e}")
        return None


async def get_task_status(db: AsyncSession, task_id: str, user_id: str):
    query = select(Task).where(Task.task_id == task_id, Task.user_id == user_id)
    result = await db.execute(query)
    task = result.scalars().first()

    if task:
        return {
            "task_id": task.task_id,
            "status": task.status,
            "result": task.result,
            "agent_id": task.agent_id,
            "goal_id": task.goal_id,
            "thought_process": task.thought_process,
            "is_cached": task.is_cached_result,
            "retry_count": task.retry_count,
            "priority": task.priority_level,
            "execution_time_ms": task.execution_time_ms,
        }

    return {"task_id": task_id, "status": "not_found", "result": None}


async def list_tasks(db: AsyncSession, user_id: str | None = None, skip: int = 0, limit: int = 100):
    """List tasks with pagination, ordered by priority then creation time."""
    query = select(Task).order_by(Task.priority_level.desc(), Task.created_at.desc())
    if user_id:
        query = query.filter(Task.user_id == user_id)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def retry_failed_tasks(db: AsyncSession, user_id: str) -> dict:
    """Auto-retry all failed tasks that haven't exceeded max_retries."""
    result = await db.execute(
        select(Task).where(
            Task.user_id == user_id,
            Task.status == "failed",
        )
    )
    failed_tasks = result.scalars().all()

    retried = 0
    skipped = 0
    for task in failed_tasks:
        if (task.retry_count or 0) >= (task.max_retries or 3):
            skipped += 1
            continue
        task.status = "queued"
        task.retry_count = (task.retry_count or 0) + 1
        retried += 1

    if retried > 0:
        await db.commit()

    logger.info(f"Auto-retry: {retried} tasks re-queued, {skipped} exceeded max retries")
    return {"retried": retried, "skipped": skipped, "total_failed": len(failed_tasks)}


async def get_system_suggestions(db: AsyncSession, user_id: str) -> list:
    """Generate AI-powered suggestions for system optimization."""
    suggestions = []

    # Check for failed tasks
    failed_result = await db.execute(
        select(Task).where(Task.user_id == user_id, Task.status == "failed")
    )
    failed_count = len(failed_result.scalars().all())
    if failed_count > 0:
        suggestions.append({
            "type": "retry",
            "title": f"Retry {failed_count} failed tasks",
            "description": f"You have {failed_count} failed tasks that can be auto-retried.",
            "action": "retry_failed",
            "severity": "warning" if failed_count < 5 else "critical",
        })

    # Check agent performance
    agent_result = await db.execute(
        select(Agent).where(Agent.owner_id == user_id)
    )
    agents = agent_result.scalars().all()
    for agent in agents:
        total = agent.total_tasks or 0
        if total >= 5:
            success_rate = (agent.successful_tasks or 0) / max(total, 1) * 100
            if success_rate < 70:
                suggestions.append({
                    "type": "performance",
                    "title": f"Agent '{agent.name}' underperforming ({success_rate:.0f}%)",
                    "description": f"Consider switching tasks to a higher-performing agent.",
                    "action": "switch_agent",
                    "agent_id": agent.agent_id,
                    "severity": "warning",
                })

    # Cost optimization suggestion
    high_cost_result = await db.execute(
        select(Task).where(
            Task.user_id == user_id,
            Task.cost > 0.05,
            Task.status == "completed"
        ).limit(10)
    )
    expensive_tasks = high_cost_result.scalars().all()
    if len(expensive_tasks) >= 3:
        avg_cost = sum(t.cost for t in expensive_tasks) / len(expensive_tasks)
        suggestions.append({
            "type": "cost",
            "title": f"Optimize costs (avg ${avg_cost:.3f}/task)",
            "description": "Consider using cost-efficient models for routine tasks.",
            "action": "optimize_cost",
            "severity": "info",
        })

    return suggestions
