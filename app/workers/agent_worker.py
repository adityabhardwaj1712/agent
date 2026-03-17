import redis.asyncio as redis
import json
import asyncio
import os
import uuid
from app.db.database import AsyncSessionLocal
from app.services.memory_service import search_memory
from app.services.model_router import select_model, call_provider
from app.services.axon_service import AxonService
from app.services.event_store import log_event
from app.services.quality import score_output
from app.services.reputation import update_reputation
from app.services.trace_service import log_trace as axon_trace
from app.models.approval import ApprovalRequest
from app.models.task import Task
from app.models.goal import Goal
from app.schemas.task_schema import TaskCreate
from app.core.llm import llm_service

async def run_worker():
    print("AgentCloud Async Worker started, listening for tasks...")
    # Note: Using redis-py async client
    redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)
    
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
                await process_one_task(db_session_factory=AsyncSessionLocal, redis_client=redis_client, task_dict=task_dict)
            except Exception as e:
                print(f"Task execution failed: {e}")
                if retry_count < max_retries:
                    backoff = 2 ** retry_count * 5  # 5s, 10s, 20s
                    print(f"Retrying task {task_dict.get('task_id')} in {backoff} seconds... (Attempt {retry_count + 1}/{max_retries})")
                    task_dict['retry_count'] = retry_count + 1
                    
                    # Store task id for later sleep and re-push
                    asyncio.create_task(delayed_retry(redis_client, "agent_tasks", task_dict, backoff))
                else:
                    print(f"Task {task_dict.get('task_id')} failed after {max_retries} retries. Marking as failed.")
                    await mark_task_failed(task_dict.get('task_id'))
            
        except Exception as e:
            print(f"Worker loop error: {e}")
            await asyncio.sleep(5)

async def delayed_retry(redis_client, queue, task_dict, delay):
    await asyncio.sleep(delay)
    await redis_client.rpush(queue, json.dumps(task_dict))

async def mark_task_failed(task_id):
    async with AsyncSessionLocal() as db:
        task_obj = await db.get(Task, task_id)
        if task_obj:
            task_obj.status = "failed"
            task_obj.result = "Failed after maximum retries."
            await db.commit()

async def process_one_task(db_session_factory, redis_client, task_dict):
    task_id = task_dict.get('task_id')
    agent_id_str = task_dict.get('agent_id')
    goal_id = task_dict.get('goal_id')
    parent_task_id = task_dict.get('parent_task_id')
    payload = task_dict.get('payload', '')
    
    print(f"Processing task {task_id}...")
    
    async with db_session_factory() as db:
        # 0. Dependency Check
        if parent_task_id:
            parent_task = await db.get(Task, parent_task_id)
            if not parent_task or parent_task.status != "completed":
                print(f"Parent task {parent_task_id} not completed. Re-queueing task {task_id}.")
                raise Exception(f"Dependency not met: Parent {parent_task_id} is {parent_task.status if parent_task else 'missing'}")

        await log_event(db, "TaskReceived", agent_id=agent_id_str, task_id=task_id, payload=task_dict)

        # 1. HITL Safety Check
        dangerous_keywords = ["delete", "wipe", "terminate", "transfer", "drop"]
        if any(k in payload.lower() for k in dangerous_keywords):
            print(f"!!! DANGEROUS OPERATION DETECTED: {payload}. Creating Approval Request.")
            approval = ApprovalRequest(
                task_id=task_id,
                agent_id=agent_id_str,
                goal_id=goal_id,
                operation="dangerous_operation",
                payload=payload,
                status="pending"
            )
            db.add(approval)
            
            task_obj = await db.get(Task, task_id)
            if task_obj:
                task_obj.status = "pending_approval"
            
            await db.commit()
            await log_event(db, "HITL_Intercepted", agent_id=agent_id_str, task_id=task_id, payload={"reason": "dangerous_keyword", "content": payload})
            await update_reputation(db, agent_id_str, success=False, task_id=task_id)
            return

        # 2. Load context from memory
        await axon_trace(db, task_id, agent_id_str, step="memory_search", input_data={"query": payload})
        context = ""
        if agent_id_str:
            memories = await search_memory(db, agent_id_str, payload)
            context = "\n".join([m.content for m in memories])
        
        await axon_trace(db, task_id, agent_id_str, step="memory_complete", output_data={"context_len": len(context)})

        # 3. Execute with AXON engine
        await axon_trace(db, task_id, agent_id_str, step="axon_reasoning_start")
        
        from app.models.tool import Tool
        from app.services.tool_executor import ToolExecutor
        from sqlalchemy.future import select
        
        tools_result = await db.execute(select(Tool).where(Tool.is_enabled == True))
        available_tools = tools_result.scalars().all()
        openai_tools = [t.to_openai_tool() for t in available_tools] if available_tools else None
        
        from app.models.agent import Agent
        agent_record = await db.get(Agent, agent_id_str)
        agent_name = agent_record.name if agent_record else "AI Agent"

        system_prompt = f"You are {agent_name}, an autonomous agent within the AgentCloud ecosystem. Use the provided context to fulfill the user request concisely.\n\nCONTEXT:\n{context}"
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": payload}
        ]
        
        max_iterations = 5
        final_result = ""
        iteration = 0
        
        while iteration < max_iterations:
            iteration += 1
            raw_result, tool_calls, reasoning_meta = await AxonService.advanced_reasoning(
                task_payload=payload, 
                context=context, 
                tools=openai_tools, 
                messages=messages
            )
            
            if not tool_calls:
                final_result = (raw_result or "") + reasoning_meta
                break
                
            messages.append({
                "role": "assistant",
                "content": raw_result or "",
                "tool_calls": tool_calls
            })
            
            for tc in tool_calls:
                tool_name = tc.function.name
                tool_args = tc.function.arguments
                await axon_trace(db, task_id, agent_id_str, step=f"tool_execution_{tool_name}", input_data={"args": tool_args})
                
                tool_result_str = await ToolExecutor.execute(tool_name, tool_args)
                await axon_trace(db, task_id, agent_id_str, step=f"tool_result_{tool_name}", output_data={"result": tool_result_str[:200]})
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": tool_name,
                    "content": tool_result_str
                })
        else:
            final_result = "AXON Guard: Terminated due to excessive tool iterations (Max 5)."
            
        result_str = final_result
        thought_log = "\n".join([f"{m['role']}: {m.get('content', '')}" for m in messages if m.get('content')])
        
        # 4. Quality Scoring & Reputation
        quality_score = await score_output(db, agent_id_str, task_id, result_str)
        is_success = quality_score > 0.4
        await update_reputation(db, agent_id_str, success=is_success, task_id=task_id)
        
        # 5. Persistent Task Update
        task_obj = await db.get(Task, task_id)
        if task_obj:
            task_obj.status = "completed" if is_success else "failed"
            task_obj.result = result_str
            task_obj.thought_process = thought_log
            task_obj.output_data = result_str
            await db.commit()
        
        # 6. Autonomous Reflection Loop
        if goal_id and is_success:
            await perform_reflection(db, redis_client, agent_id_str, goal_id, result_str)
            
        except Exception as e:
            print(f"Worker error: {e}")
            await asyncio.sleep(5)

async def perform_reflection(db, redis_client, agent_id, goal_id, last_result):
    from app.models.goal import Goal
    from app.services.task_service import send_task
    
    goal = await db.get(Goal, goal_id)
    if not goal:
        return

    print(f"Goal {goal_id} Reflection: Assessing progress...")
    
    system_prompt = """You are an Autonomous Goal Supervisor. 
Review the Goal and the result of the last task. 
Determine if the Goal is fully satisfied or if a follow-up task is required.

REPLY ONLY IN VALID JSON:
{
  "satisfied": true/false,
  "next_task_payload": "Detailed instruction for the next step IF not satisfied",
  "reasoning": "Brief explanation"
}
"""
    user_prompt = f"GOAL: {goal.description}\nTARGET OUTCOME: {goal.target_outcome}\nLAST RESULT: {last_result}"

    try:
        content, _ = await llm_service.get_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="gpt-4o"
        )
        
        if not content:
            return

        # Parse JSON
        json_str = content.strip()
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        
        reflection = json.loads(json_str)
        
        if reflection.get("satisfied"):
            print(f"Goal {goal_id} satisfied! Marking as completed.")
            goal.status = "completed"
            await db.commit()
        elif reflection.get("next_task_payload"):
            print(f"Goal {goal_id} not satisfied. Spawning next task: {reflection['next_task_payload'][:50]}...")
            # We use the same agent for now, or could re-plan.
            await send_task(db, TaskCreate(
                payload=reflection["next_task_payload"],
                agent_id=agent_id,
                goal_id=goal_id
            ))
            
    except Exception as e:
        print(f"Reflection failed for goal {goal_id}: {e}")

if __name__ == "__main__":
    asyncio.run(run_worker())
