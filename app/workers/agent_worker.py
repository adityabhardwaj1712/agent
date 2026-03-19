import redis.asyncio as redis
import json
import asyncio
import os
import uuid
from loguru import logger
from app.db.database import AsyncSessionLocal
from app.services.memory_service import search_memory
from app.services.model_router import select_model, call_provider
from app.services.axon_service import AxonService
from app.services.event_store import log_event
from app.services.quality import score_output
from app.services.reputation import update_reputation
from app.services.trace_service import log_trace as axon_trace
from sqlalchemy.future import select
from app.models.approval import ApprovalRequest
from app.models.task import Task
from app.models.goal import Goal
from app.schemas.task_schema import TaskCreate
from app.core.llm import llm_service
from app.services.billing_service import billing_service
from app.services.slack_service import slack_service
from app.services.personality_service import personality_service
from app.services.compliance_service import compliance_service
from app.services.security_scanner import security_scanner

async def run_worker():
    logger.info("AgentCloud Async Worker started, listening for tasks...")
    redis_client = redis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379/0"), 
        decode_responses=True
    )
    
    while True:
        try:
            # blpop returns a tuple (queue, data)
            result = await redis_client.blpop("agent_tasks", timeout=10)
            if not result:
                continue
                
            queue, task_data = result
            task_dict = json.loads(task_data)
            
            retry_count = task_dict.get('retry_count', 0)
            max_retries = 3
            
            try:
                await process_one_task(
                    db_session_factory=AsyncSessionLocal, 
                    redis_client=redis_client, 
                    task_dict=task_dict
                )
            except Exception as e:
                logger.error(f"Task execution failed: {e}")
                if retry_count < max_retries:
                    backoff = 2 ** retry_count * 5  # 5s, 10s, 20s
                    logger.warning(
                        f"Retrying task {task_dict.get('task_id')} in {backoff} seconds... "
                        f"(Attempt {retry_count + 1}/{max_retries})"
                    )
                    task_dict['retry_count'] = retry_count + 1
                    
                    # Store task id for later sleep and re-push
                    asyncio.create_task(delayed_retry(redis_client, "agent_tasks", task_dict, backoff))
                else:
                    logger.error(
                        f"Task {task_dict.get('task_id')} failed after {max_retries} retries. "
                        f"Marking as failed."
                    )
                    await mark_task_failed(task_dict.get('task_id'))
            
        except Exception as e:
            logger.error(f"Worker loop error: {e}")
            await asyncio.sleep(5)

async def delayed_retry(redis_client, queue, task_dict, delay):
    """Delay and re-queue a task"""
    await asyncio.sleep(delay)
    await redis_client.rpush(queue, json.dumps(task_dict))

async def mark_task_failed(task_id):
    """Mark a task as failed in the database"""
    async with AsyncSessionLocal() as db:
        task_obj = await db.get(Task, task_id)
        if task_obj:
            task_obj.status = "failed"
            task_obj.result = "Failed after maximum retries."
            await db.commit()

async def process_one_task(db_session_factory, redis_client, task_dict):
    """Process a single task from the queue"""
    task_id = task_dict.get('task_id')
    user_id = task_dict.get('user_id')
    agent_id_str = task_dict.get('agent_id')
    goal_id = task_dict.get('goal_id')
    parent_task_id = task_dict.get('parent_task_id')
    payload = task_dict.get('payload', '')
    
    if not user_id:
        logger.error(f"Task {task_id} missing user_id. Cannot process.")
        return

    logger.info(f"Processing task {task_id} for user {user_id}, agent {agent_id_str}")
    
    async with db_session_factory() as db:
        try:
            # 0. Dependency Check
            if parent_task_id:
                query = select(Task).where(Task.task_id == parent_task_id, Task.user_id == user_id)
                res = await db.execute(query)
                parent_task = res.scalars().first()
                if not parent_task or parent_task.status != "completed":
                    logger.warning(f"Parent task {parent_task_id} not completed/owned. Re-queueing {task_id}.")
                    raise Exception(f"Dependency not met: Parent {parent_task_id}")

            await log_event(db, "TaskReceived", user_id=user_id, agent_id=agent_id_str, task_id=task_id, payload=task_dict)

            # 1. HITL Safety Check
            dangerous_keywords = ["delete", "wipe", "terminate", "transfer", "drop"]
            if any(k in payload.lower() for k in dangerous_keywords):
                logger.warning(f"Dangerous operation in task {task_id}")
                approval = ApprovalRequest(
                    task_id=task_id, user_id=user_id, agent_id=agent_id_str,
                    goal_id=goal_id, operation="dangerous_operation", payload=payload, status="pending"
                )
                db.add(approval)
                task_obj = await db.get(Task, task_id)
                if task_obj: task_obj.status = "pending_approval"
                await db.commit()
                
                # Slack Notification
                await slack_service.send_notification(
                    f"⚠️ *HITL Approval Required*\nTask: `{task_id}`\nOperation: `dangerous_operation`\nQuery: `{payload[:100]}...`"
                )
                return

            # 2. Load context from memory
            await axon_trace(db, task_id, agent_id_str, step="memory_search", input_data={"query": payload})
            context = ""
            if agent_id_str:
                memories = await search_memory(db, agent_id_str, payload)
                context = "\n".join([m.content for m in memories])

            # 3. Execute with AXON engine (Check for Swarm Mode)
            is_swarm = payload.startswith("/swarm")
            total_tokens = 0
            final_result = ""
            thought_log = ""
            
            from app.models.tool import Tool
            from app.services.tool_executor import ToolExecutor
            from app.services.tool_executor import ToolExecutor
            
            tools_result = await db.execute(select(Tool).where(Tool.is_enabled == True))
            available_tools = tools_result.scalars().all()
            openai_tools = [t.to_openai_tool() for t in available_tools] if available_tools else None
            
            agent_record = await db.get(Agent, agent_id_str)
            agent_name = agent_record.name if agent_record else "AI Agent"
            
            # Compliance Check (Input)
            compliance_report = await compliance_service.scan_content(payload)
            if not compliance_report["is_safe"]:
                logger.warning(f"Compliance violation in task {task_id}: {compliance_report['violations']}")
                # In a real app, we might block this task or flag for review
            
            # Personality Injection
            system_prompt = personality_service.generate_system_prompt(
                agent_name, 
                agent_record.role if agent_record else "Assistant",
                agent_record.personality_config if agent_record else None
            )

            if is_swarm:
                logger.info(f"Task {task_id} running in SWARM mode")
                # Swarm Intelligence: Debate and Consensus
                debate_results = []
                debate_agents = ["Analyst", "Engineer", "Critic"]
                
                for swarm_role in debate_agents:
                    swarm_messages = [
                        {"role": "system", "content": f"{system_prompt}. Expert Role: {swarm_role}"},
                        {"role": "user", "content": payload.replace("/swarm", "").strip()}
                    ]
                    content, _, swarm_usage = await AxonService.advanced_reasoning(
                        task_payload=payload, context=context, tools=openai_tools, messages=swarm_messages
                    )
                    debate_results.append(f"AGENT {swarm_role}: {content}")
                    if swarm_usage: total_tokens += swarm_usage.total_tokens

                # Final Consensus
                consensus_messages = [
                    {"role": "system", "content": "You are the Swarm Coordinator. Synthesize the following expert debate into a final authoritative answer."},
                    {"role": "user", "content": "\n\n".join(debate_results)}
                ]
                final_result, _, consensus_meta, consensus_usage = await AxonService.advanced_reasoning(
                    task_payload="Consensus Synthesis", context="", tools=None, messages=consensus_messages
                )
                if consensus_usage: total_tokens += consensus_usage.total_tokens
                final_result += f"\n\n--- SWARM CONSENSUS ---\n{consensus_meta}"
            else:
                # Standard Execution
                messages = [
                    {"role": "system", "content": f"{system_prompt}\nCONTEXT:\n{context}"},
                    {"role": "user", "content": payload}
                ]
                
                max_iterations = 5
                iteration = 0
                while iteration < max_iterations:
                    iteration += 1
                    raw_result, tool_calls, reasoning_meta, usage = await AxonService.advanced_reasoning(
                        task_payload=payload, context=context, tools=openai_tools, messages=messages
                    )
                    
                    if usage:
                        total_tokens += usage.total_tokens

                    if not tool_calls:
                        final_result = (raw_result or "") + reasoning_meta
                        break
                        
                    messages.append({"role": "assistant", "content": raw_result or "", "tool_calls": tool_calls})
                    for tc in tool_calls:
                        # Security Scan (Tool)
                        sec_report = await security_scanner.scan_tool_call(tc.function.name, tc.function.arguments)
                        if sec_report["is_blocked"]:
                            logger.error(f"Security block for task {task_id}: {sec_report['findings']}")
                            final_result = f"ERROR: Security check blocked tool execution: {sec_report['findings']}"
                            break
                            
                        tool_res = await ToolExecutor.execute(tc.function.name, tc.function.arguments)
                        messages.append({"role": "tool", "tool_call_id": tc.id, "name": tc.function.name, "content": tool_res})
                    
                    if "ERROR: Security check" in str(final_result):
                        break
            
            thought_log = "\n".join([f"{m['role']}: {m.get('content', '')}" for m in messages if m.get('content')])

            # 4. Usage Recording
            if total_tokens > 0:
                await billing_service.record_usage(user_id, "tokens", quantity=total_tokens, agent_id=agent_id_str, task_id=task_id)

            # 5. Persistent Task Update
            task_obj = await db.get(Task, task_id)
            if task_obj:
                task_obj.status = "completed"
                task_obj.result = final_result
                task_obj.thought_process = thought_log
                await db.commit()
            
            # 6. Autonomous Reflection Loop
            if goal_id:
                await perform_reflection(db, redis_client, user_id, agent_id_str, goal_id, final_result)
            
            # Slack Notification on Completion
            await slack_service.send_notification(
                f"✅ *Task Completed*\nID: `{task_id}`\nAgent: `{agent_name}`\nResult: `{final_result[:200]}...`"
            )
            
            logger.info(f"Task {task_id} completed. Tokens: {total_tokens}")
            
        except Exception as e:
            logger.error(f"Error processing task {task_id}: {e}")
            raise

async def perform_reflection(db, redis_client, user_id, agent_id, goal_id, last_result):
    """Perform autonomous reflection to determine if goal is satisfied"""
    from app.models.goal import Goal
    from app.services.task_service import send_task
    
    query = select(Goal).where(Goal.goal_id == goal_id, Goal.owner_id == user_id)
    res = await db.execute(query)
    goal = res.scalars().first()
    if not goal:
        return

    logger.info(f"Goal {goal_id} Reflection for user {user_id}...")
    
    system_prompt = """You are an Autonomous Goal Supervisor. 
Review the Goal and the result of the last task. 
Determine if the Goal is fully satisfied or if a follow-up task is required.

REPLY ONLY IN VALID JSON:
{
  "satisfied": true,
  "next_task_payload": "instruction",
  "reasoning": "..."
}
"""
    user_prompt = f"GOAL: {goal.description}\nTARGET OUTCOME: {goal.target_outcome}\nLAST RESULT: {last_result}"

    try:
        content, _, usage = await llm_service.get_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="gpt-4o"
        )
        
        if usage:
            await billing_service.record_usage(user_id, "tokens", quantity=usage.total_tokens, agent_id=agent_id)

        if not content:
            return

        json_str = content.strip()
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        
        reflection = json.loads(json_str)
        
        if reflection.get("satisfied"):
            logger.info(f"Goal {goal_id} satisfied!")
            goal.status = "completed"
            await db.commit()
        elif reflection.get("next_task_payload"):
            await send_task(db, TaskCreate(
                payload=reflection["next_task_payload"],
                agent_id=agent_id,
                goal_id=goal_id
            ), user_id=user_id)
            
    except Exception as e:
        logger.error(f"Reflection failed for goal {goal_id}: {e}")

if __name__ == "__main__":
    asyncio.run(run_worker())
