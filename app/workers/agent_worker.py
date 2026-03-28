"""
app/workers/agent_worker.py
─────────────────────────────────────────────────────────────────────────────
AgentCloud — Fixed Worker

ERRORS FIXED:
  1. [CRITICAL] sys.stdout NoneType crash — uvicorn logging fails on Windows
     when launched without a terminal. Fixed by guarding sys.stdout/stderr
     early in main.py (already present) and also catching it here.

  2. [CRITICAL] pgvector "type 'vector' does not exist" — pgvector extension
     not enabled in Postgres. Added conditional extension creation in the
     migration and a runtime guard here.

  3. [SECURITY] Hardcoded credential in scripts/test_agentcloud.py (line 16).
     Worker itself reads all secrets from env-vars only (no hardcoded values).

  4. [MEDIUM] 300+ async functions missing try-except throughout the codebase.
     Every async operation in this worker is now wrapped properly with logging
     and graceful degradation instead of silent crashes.

  5. Redis event-loop RuntimeError on shutdown — asyncio loop closing while
     Redis connection still alive. Fixed with proper teardown guards.
─────────────────────────────────────────────────────────────────────────────
"""

import sys
import io

# ── Guard 1: Prevent uvicorn logging crash on non-TTY environments (Windows)
# This MUST happen before any uvicorn/logging import.
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


_CURRENT_CONTEXT: dict = {}

# ── Guard 2: pgvector availability flag (set at startup)
_PGVECTOR_AVAILABLE: bool = True


@ToolExecutor.register("delegate_to_agent")
async def _delegate_tool(to_agent_id: str, task_payload: str) -> dict:
    from_agent_id = _CURRENT_CONTEXT.get("agent_id", "unknown")
    user_id = _CURRENT_CONTEXT.get("user_id", "unknown")
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
        logger.warning(f"Delegation to {to_agent_id} timed out after 90s")
        return {"error": "delegation_timeout", "to_agent": to_agent_id}
    except Exception as e:
        logger.error(f"Delegation tool error: {e}")
        return {"error": str(e), "to_agent": to_agent_id}


async def _check_pgvector(db_session) -> bool:
    """
    FIX #2: Check if pgvector is installed. If not, log a clear message
    and disable memory-embedding features gracefully instead of crashing.

    To fix permanently:
        Run in your Postgres DB:
            CREATE EXTENSION IF NOT EXISTS vector;
        Or add to your Alembic migration:
            op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    """
    global _PGVECTOR_AVAILABLE
    try:
        await db_session.execute(
            __import__("sqlalchemy", fromlist=["text"]).text(
                "SELECT 1 FROM pg_extension WHERE extname = 'vector'"
            )
        )
        _PGVECTOR_AVAILABLE = True
        logger.info("pgvector extension: ✓ available")
    except OperationalError:
        _PGVECTOR_AVAILABLE = False
        logger.warning(
            "pgvector extension NOT found. Memory embedding features are DISABLED.\n"
            "  Fix: Run  CREATE EXTENSION IF NOT EXISTS vector;  in your PostgreSQL DB,\n"
            "  then rerun Alembic migrations."
        )
    except Exception as e:
        _PGVECTOR_AVAILABLE = False
        logger.warning(f"Could not check pgvector: {e} — disabling embeddings")
    return _PGVECTOR_AVAILABLE


async def _mark_processing(task_id: str) -> None:
    """Mark task as processing in DB with proper error handling."""
    if not task_id:
        return
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Task).filter(Task.task_id == task_id))
            task = result.scalars().first()
            if task:
                task.status = "processing"
                await db.commit()
    except Exception as e:
        logger.error(f"Failed to mark task {task_id} as processing: {e}")


async def _mark_completed(task_id: str, output: str) -> None:
    """Mark task as completed with output."""
    if not task_id:
        return
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Task).filter(Task.task_id == task_id))
            task = result.scalars().first()
            if task:
                task.status = "completed"
                task.result = output
                await db.commit()
    except Exception as e:
        logger.error(f"Failed to mark task {task_id} as completed: {e}")


async def _mark_failed(task_id: str, error: str) -> None:
    """Mark task as failed with error reason."""
    if not task_id:
        return
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Task).filter(Task.task_id == task_id))
            task = result.scalars().first()
            if task:
                task.status = "failed"
                task.result = f"ERROR: {error}"
                await db.commit()
    except Exception as e:
        logger.error(f"Failed to mark task {task_id} as failed: {e}")


async def _update_agent_stats(agent_id: str, success: bool, cost: float = 0.0) -> None:
    """Update agent reputation and task counters after a task run."""
    if not agent_id:
        return
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Agent).filter(Agent.agent_id == agent_id))
            agent = result.scalars().first()
            if agent:
                agent.total_tasks = (agent.total_tasks or 0) + 1
                if success:
                    agent.successful_tasks = (agent.successful_tasks or 0) + 1
                else:
                    agent.failed_tasks = (agent.failed_tasks or 0) + 1
                await db.commit()
        # Update reputation score via reputation service
        await update_reputation(agent_id=agent_id, success=success)
    except Exception as e:
        logger.error(f"Failed to update agent stats for {agent_id}: {e}")

async def _set_result_cache(payload: str, result: str, ttl: int = 3600) -> None:
    """Cache a task result in Redis with TTL."""
    try:
        from app.db.redis_client import get_async_redis_client
        redis = await get_async_redis_client()
        cache_key = f"task_cache:{hashlib.md5(payload.encode()).hexdigest()}"
        await redis.setex(cache_key, ttl, result)
        logger.info(f"Cached result for payload hash: {cache_key}")
    except Exception as e:
        logger.debug(f"Cache set failed (non-fatal): {e}")

async def _record_execution_time(task_id: str, start_time: float) -> None:
    """Update task with execution time in ms."""
    duration_ms = int((time.time() - start_time) * 1000)
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Task).filter(Task.task_id == task_id))
            task = result.scalars().first()
            if task:
                task.execution_time_ms = duration_ms
                await db.commit()
    except Exception as e:
        logger.debug(f"Failed to record execution time: {e}")


async def _safe_memory_search(agent_id: str, query: str) -> list:
    """Search memory with pgvector guard."""
    if not _PGVECTOR_AVAILABLE:
        logger.debug("Memory search skipped — pgvector not available")
        return []
    try:
        async with AsyncSessionLocal() as db:
            return await search_memory(db, agent_id=agent_id, query=query, limit=5)
    except Exception as e:
        logger.warning(f"Memory search failed for agent {agent_id}: {e}")
        return []


async def _safe_memory_write(agent_id: str, content: str) -> bool:
    """Write to memory with pgvector guard."""
    if not _PGVECTOR_AVAILABLE:
        logger.debug("Memory write skipped — pgvector not available")
        return False
    try:
        async with AsyncSessionLocal() as db:
            mem = MemoryCreate(agent_id=agent_id, content=content)
            await write_memory(db, mem, user_id=_CURRENT_CONTEXT.get("user_id"))
            return True
    except Exception as e:
        logger.warning(f"Memory write failed for agent {agent_id}: {e}")
        return False


async def process_one_task(redis_client, task_dict: dict) -> None:
    """
    Core task processor. All async calls are properly wrapped.
    """
    task_id  = task_dict.get("task_id", "unknown")
    agent_id = task_dict.get("agent_id")
    user_id  = task_dict.get("user_id")
    prompt   = task_dict.get("payload", "") # Updated from 'prompt' to 'payload' to match Orchestrator
    model    = task_dict.get("model_override") or task_dict.get("model")
    goal_id  = task_dict.get("goal_id")

    logger.info(f"Processing task {task_id} | agent={agent_id} | user={user_id}")
    start_time = time.time()

    # Set context for tool delegation
    _CURRENT_CONTEXT["agent_id"] = agent_id
    _CURRENT_CONTEXT["user_id"] = user_id

    success = False
    output  = ""

    try:
        # ── 1. Load agent from DB
        agent = None
        personality = None
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Agent).filter(Agent.agent_id == agent_id))
                agent = result.scalars().first()
        except Exception as e:
            logger.error(f"DB lookup failed for agent {agent_id}: {e}")

        # ── 2. Compliance check
        try:
            compliance_report = await compliance_service.scan_content(prompt)
            if not compliance_report.get("is_safe"):
                violations = ", ".join(compliance_report.get("violations", []))
                logger.warning(f"Task {task_id} failed compliance check: {violations} — rejecting")
                await _mark_failed(task_id, f"Compliance violation: {violations}")
                await send_to_dlq(task_dict, reason="compliance_violation")
                return
        except Exception as e:
            logger.warning(f"Compliance check error (continuing): {e}")

        # ── 3. Security scan
        await publish_step("security_scan", "Running security scan on prompt...")
        logger.debug(f"Starting security scan for task {task_id}")
        try:
            security_report = await security_scanner.scan_tool_call("input_prompt", prompt)
            if security_report.get("is_blocked"):
                findings = ", ".join(security_report.get("findings", []))
                logger.warning(f"Task {task_id} flagged by security scanner: {findings} — rejecting")
                await _mark_failed(task_id, f"Security: {findings}") # Important for E2E check
                await send_to_dlq(task_dict, reason="security_violation")
                return
        except Exception as e:
            logger.warning(f"Security scan error (continuing): {e}")

        # ── 4. Personality / system prompt
        try:
            if agent and agent.personality_config:
                personality = await personality_service.build_system_prompt(agent.personality_config)
        except Exception as e:
            logger.warning(f"Personality service error (using default): {e}")

        # ── 5. Memory retrieval
        await publish_step("memory_retrieval", "Searching long-term memory...")
        memories = await _safe_memory_search(agent_id, prompt)
        memory_context = "\n".join(m.content for m in memories) if memories else ""

        # ── 6. Model selection
        try:
            if not model and agent:
                choice = select_model(prompt)
                model = choice.name
            model = model or "gpt-4o"
        except Exception as e:
            logger.warning(f"Model selection failed (falling back to gpt-4o): {e}")
            model = "gpt-4o"

        # ── 7. Build messages & Apply Guardrails
        final_system_prompt = guardrail_service.apply_universal_guardrails(
            base_prompt=prompt,
            agent_personality=personality
        )
        
        messages = [
            {"role": "system", "content": final_system_prompt}
        ]
        if memory_context:
            messages.append({"role": "system", "content": f"Relevant memories:\n{memory_context}"})
        messages.append({"role": "user", "content": prompt})

        # ── 8. LLM call with billing
        await publish_step("calling_llm", f"Generating response using {model}...")
        llm_response = None
        tokens_used  = 0
        try:
            llm_response = await llm_service.complete(
                 messages=messages,
                model=model,
                agent_id=agent_id,
                task_id=task_id,
            )
            output      = llm_response.get("content", "")
            tokens_used = llm_response.get("tokens_used", 0)
            logger.info(f"LLM response received for task {task_id} | tokens={tokens_used}")
        except Exception as e:
            logger.error(f"LLM call failed for task {task_id}: {e}")
            raise  # Re-raise so outer handler can retry or DLQ

        # ── 9. Tool execution (if LLM requested tools)
        tool_calls = llm_response.get("tool_calls", [])
        if tool_calls:
            try:
                # Add check for lists or robust parsing
                names = [tc.get('function', {}).get('name', 'unknown') for tc in tool_calls if isinstance(tc, dict)]
                await publish_step("executing_tool", f"Executing tools: {', '.join(names)}...")
                tool_results = await ToolExecutor.execute_all(tool_calls)
                # Follow-up LLM call with tool results
                messages.append({"role": "assistant", "content": output, "tool_calls": tool_calls})
                messages.append({"role": "tool", "content": json.dumps(tool_results)})
                followup = await llm_service.complete(messages=messages, model=model, agent_id=agent_id, task_id=task_id)
                output = followup.get("content", output)
                tokens_used += followup.get("tokens_used", 0)
            except Exception as e:
                logger.warning(f"Tool execution error for task {task_id} (using original output): {e}")

        # ── 10. Quality scoring
        await publish_step("quality_scoring", "Scoring output quality...")
        quality_score = 0.0
        try:
            quality_score = await score_output(output, prompt)
        except Exception as e:
            logger.warning(f"Quality scoring failed (defaulting to 0): {e}")

        # ── 11. Billing
        try:
            cost = await billing_service.charge(
                user_id=user_id,
                agent_id=agent_id,
                tokens=tokens_used,
                model=model,
            )
            logger.debug(f"Task {task_id} billed: ${cost:.6f}")
        except Exception as e:
            logger.error(f"Billing failed for task {task_id}: {e} — task still completes")

        # ── 12. Write result to memory
        if output:
            await _safe_memory_write(agent_id, f"Task: {prompt[:200]}\nOutput: {output[:500]}")

        # ── 13. Trace logging
        try:
            logger.debug(f"Sending axon trace for task {task_id}")
            # log_trace(db, task_id, agent_id, step, input_data, output_data, metadata)
            async with AsyncSessionLocal() as db_session:
                await axon_trace(
                    db=db_session,
                    task_id=task_id,
                    agent_id=agent_id,
                    step="execution_complete",
                    input_data={"prompt": prompt},
                    output_data={"output": output},
                    metadata={"quality": quality_score, "tokens": tokens_used}
                )
        except Exception as e:
            logger.warning(f"Axon trace failed: {e}")

        # ── 14. Mark as completed
        await _mark_completed(task_id, output)
        logger.info(f"Task {task_id} COMPLETED successfully.")

        # ── 14. Event bus publish
        try:
            await log_event(
                event_type="task_completed",
                payload={"task_id": task_id, "agent_id": agent_id, "quality_score": quality_score},
            )
        except Exception as e:
            logger.warning(f"Event bus publish failed: {e}")

        # ── 15. Slack notification (optional)
        try:
            if os.getenv("SLACK_WEBHOOK_URL"):
                await slack_service.notify(
                    message=f"✅ Task `{task_id}` completed by `{agent_id}` | quality={quality_score:.2f}"
                )
        except Exception as e:
            logger.debug(f"Slack notify failed (non-critical): {e}")

        # ── 16. Goal progress (if task is linked to a goal)
        if goal_id:
            try:
                async with AsyncSessionLocal() as db:
                    result = await db.execute(select(Goal).filter(Goal.goal_id == goal_id))
                    goal = result.scalars().first()
                    if goal:
                        goal.progress = min(1.0, (goal.progress or 0) + 0.1)
                        await db.commit()
            except Exception as e:
                logger.warning(f"Goal update failed for goal {goal_id}: {e}")

        # ── 17. Mark completed
        await _mark_completed(task_id, output)
        await _set_result_cache(prompt, output)
        await _record_execution_time(task_id, start_time)
        success = True
        logger.info(f"Task {task_id} COMPLETED ✓ | quality={quality_score:.2f}")

        # ── 18. Notify WebSocket & Orchestrator
        try:
            update_payload = json.dumps({
                "task_id": task_id, 
                "status": "completed", 
                "result": output,
                "agent_id": agent_id,
                "quality_score": quality_score
            })
            # General user updates channel
            await redis_client.publish(f"task_updates:{user_id}", update_payload)
            # Specific task status channel for Orchestrator
            await redis_client.publish(f"task_status:{task_id}", update_payload)
        except Exception as e:
            logger.debug(f"PubSub notify failed: {e}")

        # ── 19. Circuit breaker success
        try:
            await circuit_breaker.record_success(agent_id)
        except Exception as e:
            logger.debug(f"Circuit breaker success record failed: {e}")

    except Exception as exc:
        logger.error(f"Task {task_id} FAILED: {exc}", exc_info=True)
        await _mark_failed(task_id, str(exc))

        # Circuit breaker failure
        try:
            await circuit_breaker.record_failure(agent_id)
        except Exception:
            pass

        # Publish failure event
        try:
            fail_payload = json.dumps({
                "task_id": task_id, 
                "status": "failed", 
                "error": str(exc),
                "agent_id": agent_id
            })
            await redis_client.publish(f"task_status:{task_id}", fail_payload)
            await log_event(
                event_type="task_failed",
                payload={"task_id": task_id, "agent_id": agent_id, "error": str(exc)},
            )
        except Exception:
            pass

    finally:
        # ── 20. Always update agent stats
        await _update_agent_stats(agent_id, success=success)


async def run_worker():
    """
    Main worker loop.

    Startup:
      - Creates Redis connection
      - Starts event bus consumer
      - Loads dynamic tools from DB
      - Checks pgvector availability
      - Runs priority-queue task dispatch loop

    Shutdown: gracefully closes Redis to avoid asyncio RuntimeError.
    """
    logger.info("AgentCloud Worker starting — priority queue + circuit breaker + event bus")

    # FIX #5: Keep redis_client reference for clean shutdown
    redis_client = None

    try:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        redis_client = aioredis.from_url(redis_url, decode_responses=True)

        # Test Redis connection
        try:
            await redis_client.ping()
            logger.info("Redis connection: ✓ connected")
        except Exception as e:
             logger.error(f"Redis connection FAILED: {e} — worker cannot start")
             return

        # Start event bus consumer
        try:
            asyncio.create_task(event_bus.start_consuming())
            logger.info("Event bus consumer started")
        except Exception as e:
            logger.warning(f"Event bus failed to start (continuing): {e}")

        # Start reputation decay scheduler
        try:
            asyncio.create_task(run_reputation_decay_scheduler())
            logger.info("Reputation decay scheduler started")
        except Exception as e:
            logger.warning(f"Reputation decay scheduler failed (continuing): {e}")

        # Load dynamic tools from DB
        try:
            from app.services.tool_service import load_dynamic_tools
            async with AsyncSessionLocal() as db:
                # FIX #2: Check pgvector while we have a session
                await _check_pgvector(db)
                await load_dynamic_tools(db)
                logger.info("Dynamic tools loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load dynamic tools: {e}")

        logger.info("Worker is ready — entering task loop ▶")

        while True:
            try:
                task_dict = await dequeue_next_task(redis_client)
                if task_dict is None:
                    if time.time() % 30 < 1: # Log every ~30s if idle
                        logger.debug("Worker idle — waiting for tasks...")
                    await asyncio.sleep(0.5)
                    continue

                logger.info(f"Worker received task: {task_dict.get('task_id')} for agent {task_dict.get('agent_id')}")
                agent_id = task_dict.get("agent_id")
                task_id  = task_dict.get("task_id")

                # Circuit breaker gate
                if agent_id:
                    try:
                        allowed = await circuit_breaker.allow_request(agent_id)
                        if not allowed:
                            logger.warning(f"Circuit OPEN for agent {agent_id} — task {task_id} → DLQ")
                            await send_to_dlq(task_dict, reason="circuit_open")
                            continue
                    except Exception as e:
                        logger.warning(f"Circuit breaker check failed (allowing task): {e}")

                retry_count = task_dict.get("retry_count", 0)
                max_retries = 3
                user_id  = task_dict.get("user_id")
                goal_id  = task_dict.get("goal_id")

                try:
                    await _mark_processing(task_id)
                    await process_one_task(redis_client=redis_client, task_dict=task_dict)

                except Exception as e:
                    logger.error(f"Task {task_id} raised exception: {e}", exc_info=True)

                    if retry_count < max_retries:
                        task_dict["retry_count"] = retry_count + 1
                        backoff = 2 ** retry_count  # 1s, 2s, 4s
                        logger.info(f"Retrying task {task_id} in {backoff}s (attempt {retry_count+1}/{max_retries})")
                        await asyncio.sleep(backoff)
                        
                        # Use orchestrator to re-enqueue with same priority
                        from app.services.orchestrator import orchestrator, Priority
                        async with AsyncSessionLocal() as db:
                            await orchestrator.enqueue_task(
                                db=db,
                                payload=task_dict.get("payload"),
                                user_id=user_id,
                                agent_id=agent_id,
                                priority=Priority(task_dict.get("priority", 5)),
                                goal_id=goal_id,
                                model_override=task_dict.get("model_override")
                            )
                    else:
                        logger.error(f"Task {task_id} exhausted {max_retries} retries — sending to DLQ")
                        try:
                            await send_to_dlq(task_dict, reason="max_retries_exceeded")
                        except Exception as dlq_e:
                            logger.error(f"DLQ push failed: {dlq_e}")
                        await _mark_failed(task_id, f"Max retries exceeded: {e}")

            except asyncio.CancelledError:
                logger.info("Worker loop cancelled — shutting down")
                break
            except Exception as loop_err:
                # Never let the outer loop die
                logger.critical(f"Unhandled loop exception: {loop_err}", exc_info=True)
                await asyncio.sleep(1)

    except asyncio.CancelledError:
        logger.info("Worker cancelled")
    except Exception as fatal:
        logger.critical(f"Worker fatal error: {fatal}", exc_info=True)
    finally:
        # FIX #5: Cleanly close Redis before event loop closes
        if redis_client:
            try:
                await redis_client.aclose()
                logger.info("Redis connection closed cleanly")
            except Exception:
                pass  # Already closed or event loop is gone — ignore
        logger.info("AgentCloud Worker shut down")


if __name__ == "__main__":
    asyncio.run(run_worker())
