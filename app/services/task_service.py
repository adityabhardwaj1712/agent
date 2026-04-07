from typing import List, Optional, Dict, Any, Union
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

# --- Productivity Engine ------------------------------------------------------

def _compute_task_hash(payload: str, agent_id: Optional[str] = None) -> str:
    """
    Generates a deterministic MD5 hash for task deduplication.
    
    Normalizes the payload by trimming whitespace and converting to lowercase
    to ensure consistent hits across minor formatting variations.
    
    Args:
        payload (str): The task instruction or content.
        agent_id (Optional[str]): The ID of the target agent.
        
    Returns:
        str: A 32-character hex hash.
    """
    clean_payload = (payload or "").strip().lower()
    content = f"{clean_payload}|{agent_id or 'any'}"
    return hashlib.md5(content.encode()).hexdigest()

async def _check_dedup(db: AsyncSession, task_hash: str) -> Optional[Task]:
    """
    Checks the database for an existing completed task with the same hash.
    
    Args:
        db (AsyncSession): Database session.
        task_hash (str): Pre-computed task hash.
        
    Returns:
        Optional[Task]: The existing task if found, else None.
    """
    try:
        result = await db.execute(
            select(Task)
            .where(Task.task_hash == task_hash, Task.status == "completed")
            .order_by(Task.created_at.desc())
            .limit(1)
        )
        return result.scalars().first()
    except Exception as e:
        logger.warning(f"Deduplication integrity check failed: {e}")
        return None

async def _check_result_cache(payload: str) -> Optional[str]:
    """
    Queries the Redis cache for previously computed results.
    
    Args:
        payload (str): The raw task payload.
        
    Returns:
        Optional[str]: The cached result string if available.
    """
    try:
        from ..db.redis_client import get_async_redis_client
        redis = await get_async_redis_client()
        clean_payload = (payload or "").strip().lower()
        cache_key = f"task_cache:{hashlib.md5(clean_payload.encode()).hexdigest()}"
        cached = await redis.get(cache_key)
        if cached:
            return cached.decode() if isinstance(cached, bytes) else cached
    except Exception as e:
        logger.debug(f"Redis cache lookup failed: {e}")
    return None

async def _set_result_cache(payload: str, result: str, ttl: int = 3600) -> None:
    """
    Stores a task result in Redis with a specified expiration.
    
    Args:
        payload (str): The raw task payload (used for key generation).
        result (str): The outcome to cache.
        ttl (int): Time-to-live in seconds (default 1 hour).
    """
    try:
        from ..db.redis_client import get_async_redis_client
        redis = await get_async_redis_client()
        cache_key = f"task_cache:{hashlib.md5(payload.encode()).hexdigest()}"
        await redis.setex(cache_key, ttl, result)
    except Exception as e:
        logger.debug(f"Redis cache insertion failed: {e}")

# --- Smart Agent Selection ----------------------------------------------------

async def _select_best_agent(db: AsyncSession, user_id: str) -> Optional[Agent]:
    """
    Selects the optimal agent for a task based on performance-to-cost metrics.
    
    Calculates a dynamic performance score considering success rate, 
    reputation, and cost efficiency.
    
    Args:
        db (AsyncSession): Database session.
        user_id (str): The owner initiating the selection.
        
    Returns:
        Optional[Agent]: The most suitable agent instance.
    """
    try:
        result = await db.execute(select(Agent).where(Agent.owner_id == user_id))
        agents = result.scalars().all()
        if not agents:
            return None

        def _calculate_utility(a: Agent) -> float:
            total = (a.total_tasks or 0)
            if total == 0:
                return 50.0
            success_rate = (a.successful_tasks or 0) / max(total, 1)
            cost_penalty = min((a.base_cost or 0.01) * 10, 5.0)
            return (success_rate * 100) + (a.reputation_score or 50) - cost_penalty

        agents_sorted = sorted(agents, key=_calculate_utility, reverse=True)
        return agents_sorted[0]
    except Exception as e:
        logger.warning(f"Smart agent selection failed: {e}")
        return None

# --- Core Task Service --------------------------------------------------------

async def send_task(db: AsyncSession, data: TaskCreate, user_id: str) -> Optional[Task]:
    """
    Orchestrates the dispatch of a new task to the fleet.
    
    Handles multi-stage optimization including billing validation, 
    deduplication, caching, and smart agent selection before enqueuing.
    
    Args:
        db (AsyncSession): Database session.
        data (TaskCreate): Validated task schema.
        user_id (str): ID of the requesting user.
        
    Returns:
        Optional[Task]: The resulting task record (either cached or queued).
    """
    task_hash = _compute_task_hash(data.payload, data.agent_id)

    # 1. Billing & Multi-tenancy Guard
    if not await billing_service.check_limits(db, user_id, "tasks_per_month"):
        logger.warning(f"Mission Abort: User {user_id} exceeded task limits.")
        raise PermissionError("Plan task limit reached")

    # 2. Database Deduplication
    existing = await _check_dedup(db, task_hash)
    if existing and existing.result:
        return existing

    # 3. High-Speed Result Caching
    cached_result = await _check_result_cache(data.payload or "")
    if cached_result:
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
        return cached_task

    # 4. Autonomous Agent Selection
    agent_id = data.agent_id
    if not agent_id:
        best_agent = await _select_best_agent(db, user_id)
        if best_agent:
            agent_id = best_agent.agent_id

    # 5. Semantic Priority Detection
    priority = Priority.NORMAL
    payload_lower = (data.payload or "").lower()
    if "urgent" in payload_lower or "critical" in payload_lower:
        priority = Priority.CRITICAL
    elif "high" in payload_lower:
        priority = Priority.HIGH
    elif "low" in payload_lower:
        priority = Priority.LOW

    # 6. Fleet Dispatch (ARQ Enqueue)
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
        logger.error(f"Fleet Dispatch Failure: {e}")
        raise

    # 7. Telemetry & Billing Recording
    await billing_service.record_usage(user_id, "tasks")

    # 8. Retrieve Entry
    res = await db.execute(
        select(Task).where(Task.user_id == user_id).order_by(Task.created_at.desc())
    )
    return res.scalars().first()

async def get_task_status(db: AsyncSession, task_id: str, user_id: str) -> Dict[str, Any]:
    """
    Fetches the operational status and telemetry for a specific task.
    
    Args:
        db (AsyncSession): Database session.
        task_id (str): UUID of the task.
        user_id (str): UUID of the requesting owner.
        
    Returns:
        Dict[str, Any]: Comprehensive status dictionary.
    """
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
            "payload": task.payload,
        }

    return {"task_id": task_id, "status": "not_found", "result": None}

async def list_tasks(db: AsyncSession, user_id: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Task]:
    """
    Lists tasks across the fleet with pagination and priority sorting.
    
    Args:
        db (AsyncSession): Database session.
        user_id (Optional[str]): Filters to a specific user.
        skip (int): Offset.
        limit (int): Cap.
        
    Returns:
        List[Task]: List of task records.
    """
    query = select(Task).order_by(Task.priority_level.desc(), Task.created_at.desc())
    if user_id:
        query = query.filter(Task.user_id == user_id)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def retry_failed_tasks(db: AsyncSession, user_id: str) -> Dict[str, int]:
    """
    Attempts to recover failed tasks that are within retry thresholds.
    
    Args:
        db (AsyncSession): Database session.
        user_id (str): ID of the task owner.
        
    Returns:
        Dict[str, int]: Summary of retry operations.
    """
    result = await db.execute(
        select(Task).where(Task.user_id == user_id, Task.status == "failed")
    )
    failed_tasks = result.scalars().all()

    retried, skipped = 0, 0
    for task in failed_tasks:
        if (task.retry_count or 0) >= (task.max_retries or 3):
            skipped += 1
            continue
        task.status = "queued"
        task.retry_count = (task.retry_count or 0) + 1
        retried += 1

    if retried > 0:
        await db.commit()

    return {"retried": retried, "skipped": skipped, "total_failed": len(failed_tasks)}

async def cancel_task(db: AsyncSession, task_id: str, user_id: str) -> bool:
    """
    Forcefully terminates a pending or active task.
    
    Args:
        db (AsyncSession): Database session.
        task_id (str): UUID of the task.
        user_id (str): UUID of the authorizing owner.
        
    Returns:
        bool: True if cancellation sequence completed.
    """
    result = await db.execute(select(Task).where(Task.task_id == task_id, Task.user_id == user_id))
    task = result.scalars().first()
    if not task or task.status in ["completed", "failed", "cancelled"]:
        return False
        
    task.status = "cancelled"
    task.result = "Task cancelled by user."
    await db.commit()
    
    return True
