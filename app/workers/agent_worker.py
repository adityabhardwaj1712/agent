import redis.asyncio as aioredis
import json
import asyncio
import os
import time
import uuid
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


_CURRENT_CONTEXT: dict = {}

@ToolExecutor.register("delegate_to_agent")
async def _delegate_tool(to_agent_id: str, task_payload: str) -> dict:
    from_agent_id = _CURRENT_CONTEXT.get("agent_id", "unknown")
    user_id = _CURRENT_CONTEXT.get("user_id", "unknown")
    return await agent_delegate(
        from_agent_id=from_agent_id,
        to_agent_id=to_agent_id,
        task_payload=task_payload,
        user_id=user_id,
        await_result=True,
        timeout=90,
    )


async def run_worker():
    logger.info("AgentCloud Worker started — priority queue + circuit breaker + event bus active")

    redis_client = aioredis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        decode_responses=True,
    )

    asyncio.create_task(event_bus.start_consuming())
    logger.info("Event bus consumer started")

    while True:
        try:
            task_dict = await dequeue_next_task(redis_client)
            if task_dict is None:
                await asyncio.sleep(0.5)
                continue

            agent_id = task_dict.get("agent_id")
            task_id  = task_dict.get("task_id")

            if agent_id:
                allowed = await circuit_breaker.allow_request(agent_id)
                if not allowed:
                    logger.warning(f"Circuit OPEN for agent {agent_id} — task {task_id} → DLQ")
                    await send_to_dlq(task_dict, reason="circuit_open")
                    continue

            retry_count = task_dict.get("retry_count", 0)
            max_retries = 3

            try:
                await _mark_processing(task_id)
                await process_one_task(redis_client=redis_client, task_dict=task_dict)

            except Exception as exc:
                logger.error(f"Task {task_id} failed: {exc}")
                if agent_id:
                    await circuit_breaker.record_failure(agent_id, str(exc))

                if retry_count < max_retries:
                    backoff = 2 ** retry_count * 5
                    task_dict["retry_count"] = retry_count + 1
                    asyncio.create_task(_delayed_retry(redis_client, task_dict, backoff))
                else:
                    await _mark_failed(task_id, "Max retries exceeded")

        except Exception as exc:
            logger.error(f"Worker loop error: {exc}")
            await asyncio.sleep(5)


async def _mark_processing(task_id: str | None):
    if not task_id:
        return
    async with AsyncSessionLocal() as db:
        task = await db.get(Task, task_id)
        if task and task.status == "queued":
            task.status = "processing"
            await db.commit()


async def _delayed_retry(redis_client, task_dict, delay):
    await asyncio.sleep(delay)
    from app.services.orchestrator import QUEUE_KEY
    priority_val = task_dict.get("priority", int(Priority.NORMAL))
    score = priority_val * 1_000_000_000 + int(time.time() * 1000)
    await redis_client.zadd(QUEUE_KEY, {json.dumps(task_dict): score})


async def _mark_failed(task_id: str | None, reason: str = ""):
    if not task_id:
        return
    async with AsyncSessionLocal() as db:
        task = await db.get(Task, task_id)
        if task:
            task.status = "failed"
            task.result = reason or "Failed after max retries."
            await db.commit()


async def process_one_task(redis_client, task_dict: dict):
    task_id       = task_dict.get("task_id")
    user_id       = task_dict.get("user_id")
    agent_id_str  = task_dict.get("agent_id")
    goal_id       = task_dict.get("goal_id")
    parent_task_id = task_dict.get("parent_task_id")
    payload       = task_dict.get("payload", "")

    if not user_id:
        logger.error(f"Task {task_id} missing user_id — skipping")
        return

    _CURRENT_CONTEXT["agent_id"] = agent_id_str
    _CURRENT_CONTEXT["user_id"]  = user_id

    logger.info(f"Processing task {task_id} | agent={agent_id_str} | priority={task_dict.get('priority')}")

    async with AsyncSessionLocal() as db:
        try:
            if parent_task_id:
                res = await db.execute(
                    select(Task).where(Task.task_id == parent_task_id, Task.user_id == user_id)
                )
                parent = res.scalars().first()
                if not parent or parent.status != "completed":
                    raise Exception(f"Parent {parent_task_id} not ready")

            await log_event(db, "TaskReceived", user_id=user_id, agent_id=agent_id_str,
                            task_id=task_id, payload=task_dict)

            await event_bus.publish_simple(
                "task.started", agent_id_str or "system",
                {"task_id": task_id, "payload": payload[:200]}, user_id=user_id,
            )

            dangerous = ["delete", "wipe", "terminate", "transfer", "drop"]
            if any(k in payload.lower() for k in dangerous):
                approval = ApprovalRequest(
                    task_id=task_id, user_id=user_id, agent_id=agent_id_str,
                    goal_id=goal_id, operation="dangerous_operation",
                    payload=payload, status="pending",
                )
                db.add(approval)
                task_obj = await db.get(Task, task_id)
                if task_obj:
                    task_obj.status = "pending_approval"
                await db.commit()
                await slack_service.send_notification(
                    f"HITL Required — Task `{task_id}`\n`{payload[:100]}`"
                )
                return

            compliance = await compliance_service.scan_content(payload)
            if not compliance["is_safe"]:
                logger.warning(f"Compliance issue task {task_id}: {compliance['violations']}")

            await axon_trace(db, task_id, agent_id_str, step="memory_search", input_data={"query": payload})
            context = ""
            if agent_id_str:
                memories = await search_memory(db, agent_id_str, payload)
                context = "\n".join([m.content for m in memories])

            from app.models.tool import Tool
            tools_result = await db.execute(select(Tool).where(Tool.is_enabled == True))
            available_tools = tools_result.scalars().all()
            openai_tools = [t.to_openai_tool() for t in available_tools] if available_tools else None

            delegation_tool = {
                "type": "function",
                "function": {
                    "name": "delegate_to_agent",
                    "description": "Delegate a subtask to another specialist agent and get the result back.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "to_agent_id": {"type": "string", "description": "UUID of the target agent"},
                            "task_payload": {"type": "string", "description": "The task to delegate"},
                        },
                        "required": ["to_agent_id", "task_payload"],
                    },
                },
            }
            openai_tools = (openai_tools or []) + [delegation_tool]

            agent_record = await db.get(Agent, agent_id_str)
            agent_name = agent_record.name if agent_record else "AI Agent"
            system_prompt = personality_service.generate_system_prompt(
                agent_name,
                agent_record.role if agent_record else "Assistant",
                agent_record.personality_config if agent_record else None,
            )

            total_tokens = 0
            final_result = ""
            messages = [
                {"role": "system", "content": f"{system_prompt}\nCONTEXT:\n{context}"},
                {"role": "user", "content": payload},
            ]

            is_swarm = payload.startswith("/swarm")
            if is_swarm:
                for role in ["Analyst", "Engineer", "Critic"]:
                    swarm_msgs = [
                        {"role": "system", "content": f"{system_prompt}. Expert: {role}"},
                        {"role": "user", "content": payload.replace("/swarm", "").strip()},
                    ]
                    content, _, meta, usage = await AxonService.advanced_reasoning(
                        task_payload=payload, context=context, tools=openai_tools, messages=swarm_msgs
                    )
                    final_result += f"\n\nAGENT {role}: {content}"
                    if usage:
                        total_tokens += usage.total_tokens
            else:
                for _ in range(5):
                    raw, tool_calls, meta, usage = await AxonService.advanced_reasoning(
                        task_payload=payload, context=context, tools=openai_tools, messages=messages
                    )
                    if usage:
                        total_tokens += usage.total_tokens
                    if not tool_calls:
                        final_result = (raw or "") + meta
                        break
                    messages.append({"role": "assistant", "content": raw or "", "tool_calls": tool_calls})
                    blocked = False
                    for tc in tool_calls:
                        sec = await security_scanner.scan_tool_call(tc.function.name, tc.function.arguments)
                        if sec["is_blocked"]:
                            final_result = f"Security blocked: {sec['findings']}"
                            blocked = True
                            break
                        tool_res = await ToolExecutor.execute(tc.function.name, tc.function.arguments)
                        messages.append({
                            "role": "tool", "tool_call_id": tc.id,
                            "name": tc.function.name, "content": tool_res,
                        })
                    if blocked:
                        break

            thought_log = "\n".join(
                f"{m['role']}: {m.get('content','')}" for m in messages if m.get("content")
            )

            if total_tokens > 0:
                await billing_service.record_usage(
                    user_id, "tokens", quantity=total_tokens,
                    agent_id=agent_id_str, task_id=task_id,
                )

            quality = await score_output(db, agent_id_str, task_id, final_result)
            success = quality >= 0.5
            if agent_id_str:
                await update_reputation(db, agent_id_str, success=success, task_id=task_id)
                if success:
                    await circuit_breaker.record_success(agent_id_str, quality)
                else:
                    await circuit_breaker.record_failure(agent_id_str, "low quality output", quality)

            if agent_id_str and final_result:
                await write_memory(db, MemoryCreate(
                    agent_id=agent_id_str,
                    content=f"TASK: {payload[:200]}\nRESULT: {final_result[:500]}",
                ))

            task_obj = await db.get(Task, task_id)
            if task_obj:
                task_obj.status = "completed" if success else "failed"
                task_obj.result = final_result
                task_obj.thought_process = thought_log
                await db.commit()

            await event_bus.publish_simple(
                "task.completed" if success else "task.failed",
                agent_id_str or "system",
                {"task_id": task_id, "result": final_result[:500], "quality": quality},
                user_id=user_id,
            )

            if goal_id:
                await _perform_reflection(db, user_id, agent_id_str, goal_id, final_result)

            emoji = "✅" if success else "⚠️"
            await slack_service.send_notification(
                f"{emoji} Task `{task_id}` | Agent `{agent_name}` "
                f"| Quality `{quality:.2f}` | Tokens `{total_tokens}`"
            )
            logger.info(f"Task {task_id} done — quality={quality:.2f} tokens={total_tokens}")

        except Exception as exc:
            logger.error(f"Task {task_id} error: {exc}")
            raise

async def _perform_reflection(db, user_id, agent_id, goal_id, last_result):
    from app.services.task_service import send_task
    res = await db.execute(select(Goal).where(Goal.goal_id == goal_id, Goal.owner_id == user_id))
    goal = res.scalars().first()
    if not goal:
        return

    system_prompt = (
        "You are an Autonomous Goal Supervisor.\n"
        "Reply ONLY in valid JSON:\n"
        '{"satisfied": true, "next_task_payload": "...", "reasoning": "..."}'
    )
    content, _, usage = await llm_service.get_completion(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"GOAL: {goal.description}\nLAST RESULT: {last_result}"},
        ],
        model="gpt-4o-mini",
    )
    if usage:
        await billing_service.record_usage(user_id, "tokens", quantity=usage.total_tokens, agent_id=agent_id)
    if not content:
        return

    try:
        js = content.strip()
        if "```json" in js:
            js = js.split("```json")[1].split("```")[0].strip()
        data = json.loads(js)
        if data.get("satisfied"):
            goal.status = "completed"
            await db.commit()
            await event_bus.publish_simple("goal.completed", agent_id or "system",
                                           {"goal_id": goal_id}, user_id=user_id)
        elif data.get("next_task_payload"):
            await send_task(db, TaskCreate(
                payload=data["next_task_payload"], agent_id=agent_id, goal_id=goal_id
            ), user_id=user_id)
    except Exception as exc:
        logger.error(f"Reflection parse failed for goal {goal_id}: {exc}")

async def main():
    await asyncio.gather(
        run_worker(),
        run_reputation_decay_scheduler(interval_seconds=3600),
    )

if __name__ == "__main__":
    asyncio.run(main())
