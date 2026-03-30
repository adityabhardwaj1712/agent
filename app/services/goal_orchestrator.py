import json
import logging
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from .axon_service import AxonService
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
            raw_dag, _, _, _ = await AxonService.advanced_reasoning(
                task_payload="Decomposition",
                context="Generating DAG for autonomous mission.",
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
        # Logic for traversing the DAG and enqueuing tasks
        # This will be integrated with the main Orchestrator in Task 4.2
        pass

goal_orchestrator = GoalOrchestrator()
