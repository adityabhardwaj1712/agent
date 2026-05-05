import json
import logging
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from .model_router import select_model, call_provider
from sqlalchemy import select
from ..models.goal import Goal
from ..models.task import Task
from ..schemas.task_schema import TaskCreate
import uuid

logger = logging.getLogger(__name__)

class GoalOrchestrator:
    """
    Handles autonomous mission planning by decomposing high-level goals into 
    executable task graphs (DAGs).
    """

    async def decompose_goal(self, db: AsyncSession, goal_id: str, mission_description: str):
        """
        Uses Axon reasoning to generate a DAG of tasks for a goal.
        """
        logger.info(f"Decomposing goal {goal_id}: {mission_description[:50]}...")

        system_prompt = """You are a Mission Planner.
Break the user's MISSION into a series of logical tasks.
Some tasks depend on others. Represent this as a DAG.

REPLY ONLY WITH A JSON OBJECT in this format:
{
  "nodes": [
    {"id": "t1", "label": "Task 1 description", "role": "researcher"},
    {"id": "t2", "label": "Task 2 description", "role": "writer"}
  ],
  "edges": [
    {"from": "t1", "to": "t2", "type": "dependency"}
  ]
}
"""
        user_prompt = f"MISSION: {mission_description}"

        try:
            # High-reasoning call
            choice = select_model("Decomposition")
            raw_dag, _, _ = await call_provider(
                choice=choice,
                prompt=user_prompt,
                context=system_prompt,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )

            # Parse and save to Goal
            dag_data = json.loads(raw_dag)
            
            # Update Goal in DB
            from sqlalchemy import update
            await db.execute(
                update(Goal)
                .where(Goal.goal_id == goal_id)
                .values(workflow_json=json.dumps(dag_data), workflow_type="dag")
            )
            await db.commit()

            logger.info(f"Goal {goal_id} decomposed into {len(dag_data.get('nodes', []))} nodes.")
            return dag_data
            
        except Exception as e:
            logger.error(f"Goal decomposition failed: {e}")
            return None

    async def execute_dag_step(self, db: AsyncSession, goal_id: str):
        """
        Finds the next 'ready' tasks in the DAG (those with completed parents) and enqueues them.
        """
        from .orchestrator import orchestrator, Priority
        
        result = await db.execute(select(Goal).where(Goal.goal_id == goal_id))
        goal = result.scalars().first()
        if not goal or not goal.workflow_json:
            return 0
            
        dag = json.loads(goal.workflow_json)
        nodes = dag.get("nodes", [])
        edges = dag.get("edges", [])
        
        # 1. Identify completed node IDs
        completed_ids = {n["id"] for n in nodes if n.get("status") == "completed"}
        
        # 2. Identify ready nodes (idle and all parents completed)
        ready_nodes = []
        for node in nodes:
            if node.get("status") != "idle":
                continue
                
            parents = [e["from"] for e in edges if e["to"] == node["id"]]
            if all(p in completed_ids for p in parents):
                ready_nodes.append(node)
                
        # 3. Enqueue ready nodes
        for node in ready_nodes:
            logger.info(f"Enqueuing DAG node: {node.get('name', node['id'])} (Goal: {goal_id})")
            
            # Update status in local DAG object first
            node["status"] = "running"
            
            # Map role/agent if possible
            agent_id = node.get("agent_id") or "researcher" 
            
            await orchestrator.enqueue_task(
                db=db,
                payload=node.get("prompt", node.get("label")),
                user_id=goal.user_id,
                agent_id=agent_id,
                priority=Priority.NORMAL,
                goal_id=goal_id,
                node_id=node["id"]
            )
            
        # 4. Save updated DAG state
        goal.workflow_json = json.dumps(dag)
        await db.commit()
        
        return len(ready_nodes)

goal_orchestrator = GoalOrchestrator()
