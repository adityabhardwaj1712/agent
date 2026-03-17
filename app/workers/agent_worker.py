import redis.asyncio as redis
import json
import asyncio
import os
import uuid
from app.db.database import AsyncSessionLocal
from app.services.memory_service import search_memory
from app.services.model_router import select_model
from app.db.redis_client import get_redis_client

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
            
            agent_id = uuid.UUID(task.get('agent_id')) if task.get('agent_id') else None
            payload = task.get('payload', '')
            
            print(f"Processing task {task.get('task_id')}...")
            
            # 1. HITL Safety Check
            dangerous_keywords = ["delete", "wipe", "terminate", "transfer", "drop"]
            if any(k in payload.lower() for k in dangerous_keywords):
                print(f"!!! DANGEROUS OPERATION DETECTED: {payload}. Intercepting.")
                continue

            # 2. Load context from memory
            async with AsyncSessionLocal() as db:
                context = ""
                if agent_id:
                    memories = await search_memory(db, str(agent_id), payload)
                    context = "\n".join([m.content for m in memories])
                
                # 3. Select model (keeping it sync and off-loading if needed, but for now simple)
                model = select_model(payload)
                result_str = f"PROCESSED_BY_{model.name}: " + payload[:20]
                
                # 4. Handle result
                print(f"Task {task.get('task_id')} completed with result: {result_str[:50]}")
            
        except Exception as e:
            print(f"Worker error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(run_worker())
