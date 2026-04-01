import asyncio
import json
import uuid
import sys
import os
from loguru import logger

# Add project root to sys.path
sys.path.append(os.getcwd())

from app.db.database import AsyncSessionLocal
from app.models.goal import Goal
from app.models.task import Task
from app.models.trace import Trace
from app.services.goal_orchestrator import goal_orchestrator
from sqlalchemy import select

async def run_masterwork():
    logger.info("🚀 INITIATING MASTERWORK MISSION: 'Global AI Ethics Posture 2024'")
    
    user_id = "system_default"
    mission_id = str(uuid.uuid4())
    
    async with AsyncSessionLocal() as db:
        # 1. Create a High-Level Goal
        goal = Goal(
            goal_id=mission_id,
            user_id=user_id,
            name="Global AI Ethics Posture 2024",
            description="Perform a deep research mission into global AI ethics, involving a Strategist, a Researcher, and a Critic for peer-review.",
            status="active"
        )
        db.add(goal)
        await db.commit()
        logger.info(f"✓ Mission Goal Created: {mission_id}")

        # 2. Decompose into Swarm DAG
        # Strategist -> Researcher -> Critic
        dag_definition = {
            "nodes": [
                {
                    "id": "node_strat", 
                    "label": "Develop Research Strategy", 
                    "agent_id": "strategist", 
                    "status": "idle",
                    "prompt": "Create a detailed research plan for analyzing global AI ethics in 2024. Focus on EU AI Act and US Executive Orders."
                },
                {
                    "id": "node_res", 
                    "label": "Execute Subject Research", 
                    "agent_id": "researcher", 
                    "status": "idle",
                    "prompt": "Research the current status of the EU AI Act and recent US AI safety guidelines. Provide a 3-paragraph summary."
                },
                {
                    "id": "node_crit", 
                    "label": "Peer-Review & Refinement", 
                    "agent_id": "critic", 
                    "status": "idle",
                    "prompt": "Review the research summary for accuracy and bias. Focus on whether the EU AI Act implications are correctly interpreted."
                }
            ],
            "edges": [
                {"from": "node_strat", "to": "node_res", "type": "dependency"},
                {"from": "node_res", "to": "node_crit", "type": "dependency"}
            ]
        }
        
        goal.workflow_json = json.dumps(dag_definition)
        goal.workflow_type = "dag"
        await db.commit()
        logger.info("✓ Swarm DAG Definition Programmed")

        # 3. Trigger Execution Loop
        logger.info("▶ Launching Swarm Execution Loop...")
        enqueued = await goal_orchestrator.execute_dag_step(db, mission_id)
        logger.info(f"✓ Enqueued {enqueued} initial tasks (Strategist Phase)")

        # 4. Wait & Verify Traces (Simplified for script)
        logger.info("⌛ Monitoring Swarm Telemetry & LLMOps Traces...")
        # In a real environment, the worker would process these. 
        # For verification, we'll check if the 'Strategist' task was created.
        
        task_res = await db.execute(select(Task).where(Task.goal_id == mission_id))
        tasks = task_res.scalars().all()
        logger.info(f"✓ Task Registry: {len(tasks)} tasks active in mission.")
        
        for t in tasks:
            logger.info(f"  - [{t.status.upper()}] Task: {t.node_id} (Agent: {t.agent_id})")

    logger.info("✅ MASTERWORK MISSION INITIALIZED SUCCESSFULLY")
    logger.info("Mission Command: Telemetry Mesh and LLMOps Hub will now track live execution.")

if __name__ == "__main__":
    asyncio.run(run_masterwork())
