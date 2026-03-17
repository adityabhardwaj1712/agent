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
from app.models.approval import ApprovalRequest
from app.models.task import Task

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
            task = json.loads(task_data)
            
            task_id = task.get('task_id')
            agent_id_str = task.get('agent_id')
            agent_id = uuid.UUID(agent_id_str) if agent_id_str else None
            payload = task.get('payload', '')
            
            print(f"Processing task {task_id}...")
            
            async with AsyncSessionLocal() as db:
                await log_event(db, "TaskReceived", agent_id=agent_id_str, task_id=task_id, payload=task)

                # 1. HITL Safety Check (Phase 11: Create Approval Request)
                dangerous_keywords = ["delete", "wipe", "terminate", "transfer", "drop"]
                if any(k in payload.lower() for k in dangerous_keywords):
                    print(f"!!! DANGEROUS OPERATION DETECTED: {payload}. Creating Approval Request.")
                    approval = ApprovalRequest(
                        task_id=task_id,
                        agent_id=agent_id_str,
                        operation="dangerous_operation",
                        payload=payload,
                        status="pending"
                    )
                    db.add(approval)
                    
                    # Update task status
                    task_obj = await db.get(Task, task_id)
                    if task_obj:
                        task_obj.status = "pending_approval"
                    
                    await db.commit()
                    
                    await log_event(db, "HITL_Intercepted", agent_id=agent_id_str, task_id=task_id, payload={"reason": "dangerous_keyword", "content": payload})
                    await update_reputation(db, agent_id_str, success=False, task_id=task_id)
                    continue

                # 2. Load context from memory
                await log_event(db, "MemorySearchStarted", agent_id=agent_id_str, task_id=task_id)
                context = ""
                if agent_id:
                    memories = await search_memory(db, str(agent_id), payload)
                    context = "\n".join([m.content for m in memories])
                
                await log_event(db, "MemorySearchCompleted", agent_id=agent_id_str, task_id=task_id, payload={"context_len": len(context)})

                # 3. Select model & Execute Real LLM Call using Axon engine (Phase 10)
                await log_event(db, "ThinkingStarted", agent_id=agent_id_str, task_id=task_id)
                result_str = await AxonService.advanced_reasoning(payload, context)
                
                # 4. Quality Scoring & Reputation
                quality_score = await score_output(db, agent_id_str, task_id, result_str)
                await log_event(db, "QualityScored", agent_id=agent_id_str, task_id=task_id, payload={"score": quality_score})
                
                is_success = quality_score > 0.4
                await update_reputation(db, agent_id_str, success=is_success, task_id=task_id)
                
                # 5. Persistent Task Update (Postgres)
                task_obj = await db.get(Task, task_id)
                if task_obj:
                    task_obj.status = "completed" if is_success else "failed"
                    task_obj.result = result_str
                    await db.commit()
                
                # 6. Handle result
                print(f"Task {task_id} completed with result: {result_str[:50]}... (Quality: {quality_score})")
                await log_event(db, "TaskCompleted", agent_id=agent_id_str, task_id=task_id, payload={"result": result_str, "success": is_success})
                
                # Update metrics in Redis
                await redis_client.incr("metrics:tasks_submitted_total")
                if not is_success:
                    await redis_client.incr("metrics:tasks_failed_total")
            
        except Exception as e:
            print(f"Worker error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(run_worker())
