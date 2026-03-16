import redis
import json
import time
import os
from sqlalchemy.orm import Session
import uuid
from ..db.database import SessionLocal
from ..services.memory_service import MemoryService
from ..services.model_router_service import ModelRouterService
from ..services.agent_service import AgentService

def run_worker():
    print("AgentCloud Worker started, listening for tasks...")
    db = SessionLocal()
    while True:
        try:
            _, task_data = redis_client.blpop("agent_tasks")
            task = json.loads(task_data)
            
            agent_id = uuid.UUID(task.get('agent_id')) if task.get('agent_id') else None
            
            print(f"Processing task {task.get('task_id')}...")
            
            # 1. Load context from memory
            context = ""
            if agent_id:
                memories = MemoryService.search_memory(db, agent_id, task.get('payload', ''))
                context = "\n".join([m.content for m in memories])
            
            # 2. Select model and execute
            model = ModelRouterService.select_model(task.get('task_type', 'general'))
            result = ModelRouterService.get_completion(
                model=model,
                prompt=task.get('payload', ''),
                system_prompt=f"Context:\n{context}"
            )
            
            # 3. Handle result (stub for now)
            print(f"Task {task.get('task_id')} completed with result: {result[:50]}")
            
        except Exception as e:
            print(f"Worker error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    run_worker()
