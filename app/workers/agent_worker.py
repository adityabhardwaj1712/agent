"""
app/workers/agent_worker.py
-----------------------------------------------------------------------------
AgentCloud - Fixed Worker (ASCII COMPATIBLE)
-----------------------------------------------------------------------------
"""

import sys
import io

# -- Guard 1: Prevent uvicorn logging crash on non-TTY environments (Windows)
if sys.stdout is None:
    sys.stdout = io.StringIO()
if sys.stderr is None:
    sys.stderr = io.StringIO()

import redis.asyncio as aioredis
import json
import asyncio
import os
import time
import uuid
import hashlib
import signal
from redis.asyncio.lock import Lock
from loguru import logger

from app.db.database import AsyncSessionLocal
from app.services.memory_service import search_memory, write_memory
from app.services.model_router import select_model, call_provider
from app.services.axon_service import AxonService
from app.services.event_store import log_event
from app.services.quality import score_output
from app.services.reputation import update_reputation
from app.services.trace_service import log_trace as axon_trace
from app.services.orchestrator import dequeue_next_task, run_reputation_decay_scheduler, Priority
from app.services.circuit_breaker import circuit_breaker, send_to_dlq, CircuitState
from app.services.event_bus import event_bus, agent_delegate
from sqlalchemy.future import select
from sqlalchemy.exc import OperationalError

from app.models.approval import ApprovalRequest
from app.models.task import Task
from app.models.agent import Agent
from app.models.goal import Goal
from app.schemas.task_schema import TaskCreate
from app.schemas.memory_schema import MemoryCreate
from app.core.llm import llm_service
from app.services.billing_service import billing_service
from app.services.slack_service import slack_service
from app.services.personality_service import personality_service
from app.services.compliance_service import compliance_service
from app.services.security_scanner import security_scanner
from app.services.tool_executor import ToolExecutor
from app.services.guardrail_service import guardrail_service

from contextvars import ContextVar

# -- Scoped Context for concurrent tasks
_AGENT_ID_CONTEXT: ContextVar[str] = ContextVar("_AGENT_ID_CONTEXT", default="unknown")
_USER_ID_CONTEXT: ContextVar[str] = ContextVar("_USER_ID_CONTEXT", default="unknown")

# -- pgvector availability flag
_PGVECTOR_AVAILABLE: bool = True

# -- Termination Control
_IS_SHUTTING_DOWN = False

@ToolExecutor.register("delegate_to_agent")
async def _delegate_tool(to_agent_id: str, task_payload: str) -> dict:
    from_agent_id = _AGENT_ID_CONTEXT.get()
    user_id = _USER_ID_CONTEXT.get()
    try:
        return await agent_delegate(
            from_agent_id=from_agent_id,
            to_agent_id=to_agent_id,
            task_payload=task_payload,
            user_id=user_id,
            await_result=True,
            timeout=90,
        )
    except asyncio.TimeoutError:
        return {"error": "communication_timeout", "to_agent": to_agent_id}
    except Exception as e:
        return {"error": str(e), "to_agent": to_agent_id}

async def _check_pgvector(db_session) -> bool:
    global _PGVECTOR_AVAILABLE
    try:
        await db_session.execute(__import__("sqlalchemy", fromlist=["text"]).text("SELECT 1 FROM pg_extension WHERE extname = 'vector'"))
        _PGVECTOR_AVAILABLE = True
    except Exception:
        _PGVECTOR_AVAILABLE = False
    return _PGVECTOR_AVAILABLE

async def _mark_processing(task_id: str) -> None:
    if not task_id: return
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Task).filter(Task.task_id == task_id))
            task = result.scalars().first()
            if task:
                task.status = "processing"
                await db.commit()
    except Exception as e:
        logger.error(f"Failed to mark processing: {e}")

async def _mark_completed(task_id: str, output: str) -> None:
    if not task_id: return
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Task).filter(Task.task_id == task_id))
            task = result.scalars().first()
            if task:
                task.status = "completed"
                task.result = output
                await db.commit()
    except Exception as e:
        logger.error(f"Failed to mark completed: {e}")

async def _mark_failed(task_id: str, error: str) -> None:
    if not task_id: return
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Task).filter(Task.task_id == task_id))
            task = result.scalars().first()
            if task:
                task.status = "failed"
                task.result = f"ERROR: {error}"
                await db.commit()
    except Exception as e:
        logger.error(f"Failed to mark failed: {e}")

async def _mark_interrupted(task_id: str) -> None:
    if not task_id: return
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Task).filter(Task.task_id == task_id))
            task = result.scalars().first()
            if task and task.status == "processing":
                task.status = "failed"
                task.result = "INTERRUPTED: Worker shut down during execution."
                await db.commit()
                logger.warning(f"Task {task_id} marked as INTERRUPTED")
    except Exception as e:
        logger.error(f"Interruption mark failed: {e}")

async def _publish_step_impl(redis_client, task_id: str, step: str, details: str):
    try:
        payload = json.dumps({"task_id": task_id, "step": step, "details": details, "timestamp": time.time()})
        await redis_client.publish(f"task_steps:{task_id}", payload)
    except Exception: pass

async def _update_agent_stats(agent_id: str, success: bool, task_id: str) -> None:
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Agent).filter(Agent.agent_id == agent_id))
            agent = result.scalars().first()
            if agent:
                agent.total_tasks = (agent.total_tasks or 0) + 1
                if success: agent.successful_tasks = (agent.successful_tasks or 0) + 1
                else: agent.failed_tasks = (agent.failed_tasks or 0) + 1
                await db.commit()
            await update_reputation(db=db, agent_id=agent_id, success=success, task_id=task_id)
    except Exception: pass

async def _safe_memory_search(agent_id: str, query: str) -> list:
    try:
        async with AsyncSessionLocal() as db:
            res = await search_memory(db, agent_id=agent_id, query=query, limit=5)
            return res.get("results", [])
    except Exception: return []

async def _safe_memory_write(agent_id: str, content: str) -> bool:
    try:
        async with AsyncSessionLocal() as db:
            mem = MemoryCreate(agent_id=agent_id, content=content)
            await write_memory(db, mem, user_id=_USER_ID_CONTEXT.get())
            return True
    except Exception: return False

async def process_one_task(redis_client, task_dict: dict) -> None:
    if _IS_SHUTTING_DOWN: return
    task_id = task_dict.get("task_id", "unknown")
    agent_id = task_dict.get("agent_id")
    user_id = task_dict.get("user_id")
    prompt = task_dict.get("payload", "")
    model = task_dict.get("model_override") or task_dict.get("model", "gpt-4o")

    lock = Lock(redis_client, f"lock:task:{task_id}", timeout=300)
    try:
        if not await lock.acquire(blocking=False): return
        
        _AGENT_ID_CONTEXT.set(agent_id or "unknown")
        _USER_ID_CONTEXT.set(user_id or "unknown")
        success = False
        output = ""

        try:
            if _IS_SHUTTING_DOWN: raise asyncio.CancelledError()
            
            # 1. Retrieval
            memories = await _safe_memory_search(agent_id, prompt)
            memory_context = "\n".join(m.content for m in memories) if memories else ""
            
            if _IS_SHUTTING_DOWN: raise asyncio.CancelledError()

            # 2. Completion
            messages = [{"role": "system", "content": "You are a helpful agent."}]
            if memory_context: messages.append({"role": "system", "content": f"Context:\n{memory_context}"})
            messages.append({"role": "user", "content": prompt})
            
            llm_res = await llm_service.complete(messages=messages, model=model, agent_id=agent_id, task_id=task_id)
            output = llm_res.get("content", "")
            tokens = llm_res.get("tokens_used", 0)

            if _IS_SHUTTING_DOWN: raise asyncio.CancelledError()

            # 3. Tool use
            tool_calls = llm_res.get("tool_calls", [])
            if tool_calls:
                results = await ToolExecutor.execute_all(tool_calls)
                messages.append({"role": "assistant", "content": output, "tool_calls": tool_calls})
                messages.append({"role": "tool", "content": json.dumps(results)})
                followup = await llm_service.complete(messages=messages, model=model, agent_id=agent_id, task_id=task_id)
                output = followup.get("content", output)
                tokens += followup.get("tokens_used", 0)

            # 4. Finalize
            await billing_service.charge(user_id=user_id, agent_id=agent_id, tokens=tokens, model=model)
            if output: await _safe_memory_write(agent_id, output)
            await _mark_completed(task_id, output)
            success = True
            
        except asyncio.CancelledError:
            await _mark_interrupted(task_id)
            raise
        except Exception as e:
            logger.error(f"Task {task_id} error: {e}")
            await _mark_failed(task_id, str(e))
        finally:
            if await lock.locked(): await lock.release()
            await _update_agent_stats(agent_id, success=success, task_id=task_id)
    except Exception as e:
        logger.error(f"Critical execution error: {e}")

async def run_worker():
    global _IS_SHUTTING_DOWN
    logger.info("AgentCloud Worker Starting...")
    
    def handle_shutdown():
        global _IS_SHUTTING_DOWN
        _IS_SHUTTING_DOWN = True
        for t in asyncio.all_tasks():
            if t is not asyncio.current_task(): t.cancel()

    loop = asyncio.get_running_loop()
    try:
        loop.add_signal_handler(signal.SIGINT, handle_shutdown)
        loop.add_signal_handler(signal.SIGTERM, handle_shutdown)
    except NotImplementedError: pass

    redis_client = None
    try:
        redis_client = aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)
        asyncio.create_task(event_bus.start_consuming())
        asyncio.create_task(run_reputation_decay_scheduler())
        
        async with AsyncSessionLocal() as db:
            await _check_pgvector(db)
            from app.services.tool_service import load_dynamic_tools
            await load_dynamic_tools(db)

        while not _IS_SHUTTING_DOWN:
            task = await dequeue_next_task(redis_client)
            if not task:
                await asyncio.sleep(0.5)
                continue
            if _IS_SHUTTING_DOWN: break
            
            await _mark_processing(task.get("task_id"))
            await process_one_task(redis_client, task)
    finally:
        if redis_client: await redis_client.aclose()
        logger.info("Worker Offline.")

if __name__ == "__main__":
    asyncio.run(run_worker())
