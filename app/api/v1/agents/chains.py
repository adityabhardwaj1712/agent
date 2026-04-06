from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

class ChainStep(BaseModel):
    agent_role: str
    prompt: str

class ChainCreate(BaseModel):
    name: str
    steps: List[ChainStep]

@router.post("/")
async def create_chain(
    chain: ChainCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.services.dag_engine import dag_engine
    import uuid
    import json
    from app.services.orchestrator import orchestrator
    
    goal_id = str(uuid.uuid4())
    nodes = []
    edges = []
    
    prev_id = None
    for i, step in enumerate(chain.steps):
        node_id = f"step_{i}_{uuid.uuid4().hex[:8]}"
        nodes.append({
            "id": node_id,
            "description": f"Role ({step.agent_role}): {step.prompt}",
            "agent_id": None 
        })
        if prev_id:
            edges.append({
                "source": prev_id,
                "target": node_id
            })
        prev_id = node_id

    async def execute_step(description: str) -> str:
        return await orchestrator.execute_task(
            payload=description,
            user_id=current_user.user_id
        )

    import asyncio
    async def run_dag():
        try:
            results = await dag_engine.execute_workflow(goal_id, nodes, edges, execute_step)
            from app.db.redis_client import get_async_redis_client
            redis = await get_async_redis_client()
            await redis.publish(f"task_updates:{current_user.user_id}", json.dumps({
                "type": "chain_complete",
                "goal_id": goal_id,
                "name": chain.name,
                "status": "completed",
                "results": results
            }))
        except Exception as e:
            from loguru import logger
            logger.error(f"Chain execution error: {e}")

    background_tasks.add_task(run_dag)
    
    return {"status": "chain_started", "goal_id": goal_id, "nodes": len(nodes)}
