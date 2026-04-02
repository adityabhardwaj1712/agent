"""
app/workers/arq_worker.py
-----------------------------------------------------------------------------
AgentCloud - ARQ Distributed Worker
Replaces the manual agent_worker.py with a production-grade Redis queue.
-----------------------------------------------------------------------------
"""

import sys
import io
import asyncio
import os
import json
from loguru import logger
from arq import create_pool
from arq.connections import RedisSettings

# Reuse logic from the original worker but wrapped as ARQ tasks
from app.workers.agent_worker import process_one_task, _check_pgvector
from app.db.database import AsyncSessionLocal
from app.services.tool_service import load_dynamic_tools
from app.services.event_bus import event_bus
from app.services.orchestrator import run_reputation_decay_scheduler

async def startup(ctx):
    """Worker startup logic."""
    logger.info("ARQ Worker starting up...")
    
    # Check pgvector and load tools
    try:
        async with AsyncSessionLocal() as db:
            await _check_pgvector(db)
            await load_dynamic_tools(db)
            logger.info("Dynamic tools loaded successfully")
    except Exception as e:
        logger.error(f"Startup error: {e}")

    # Start sidecars (Event Bus, Reputation Decay)
    ctx['event_bus_task'] = asyncio.create_task(event_bus.start_consuming())
    ctx['reputation_task'] = asyncio.create_task(run_reputation_decay_scheduler())

async def shutdown(ctx):
    """Graceful shutdown logic."""
    logger.info("ARQ Worker shutting down...")
    if 'event_bus_task' in ctx:
        ctx['event_bus_task'].cancel()
    if 'reputation_task' in ctx:
        ctx['reputation_task'].cancel()

async def run_agent_task(ctx, task_dict: dict):
    """
    Wrapper for the original process_one_task logic.
    ARQ provides the Redis connection via ctx['redis'].
    """
    task_id = task_dict.get("task_id", "unknown")
    logger.info(f"ARQ Job received: {task_id}")
    
    # process_one_task expects aioredis but arq uses its own connection pool.
    # We pass ctx['redis'] which is arq's redis pool (compatible enough for .publish)
    await process_one_task(ctx['redis'], task_dict)

class WorkerSettings:
    """ARQ Worker configuration."""
    functions = [run_agent_task]
    redis_settings = RedisSettings.from_dsn(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    on_startup = startup
    on_shutdown = shutdown
    # Allow multiple concurrent jobs per worker process
    max_jobs = 10 
    # Job timeout (90s matching delegation timeout)
    job_timeout = 120 
