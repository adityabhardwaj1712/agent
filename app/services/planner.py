import logging
import json
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.agent import Agent
from app.core.llm import llm_service

logger = logging.getLogger(__name__)

class PlannedTask(BaseModel):
    task_payload: str
    agent_id: str
    reason: str
    depends_on: Optional[int] = None # Index of the parent task in the list

class GoalPlan(BaseModel):
    tasks: List[PlannedTask]
    summary: str

class PlannerService:
    """
    Intelligent Planner: Decomposes goals into a sequence of agent-specific tasks.
    """

    @staticmethod
    async def generate_plan(db: AsyncSession, goal_description: str, owner_id: str) -> Optional[GoalPlan]:
        # 1. Fetch available agents for this owner
        result = await db.execute(select(Agent).where(Agent.owner_id == owner_id))
        agents = result.scalars().all()
        
        if not agents:
            logger.warning(f"No agents found for owner {owner_id}. Cannot plan.")
            return None

        agent_context = "\n".join([
            f"- ID: {a.agent_id} | Name: {a.name} | Role: {a.role or 'General'} | Description: {a.description or 'No description'}"
            for a in agents
        ])

        # 2. Craft Planning Prompt
        system_prompt = """You are the Lead Architect of the AgentCloud ecosystem. 
Your job is to take a high-level goal and break it down into a sequence of discrete, actionable tasks.
For each task, you must select the most appropriate agent from the provided list.

REPLY ONLY IN VALID JSON.
Expected Format:
{
  "tasks": [
    {
      "task_payload": "Specific instruction for the agent",
      "agent_id": "UUID-of-the-selected-agent",
      "reason": "Why this agent was chosen",
      "depends_on": null // Index of the task this task depends on (0-indexed), or null
    }
  ],
  "summary": "Brief overview of the strategy"
}
"""
        user_prompt = f"GOAL: {goal_description}\n\nAVAILABLE AGENTS:\n{agent_context}"

        # 3. Call LLM
        try:
            content, _ = await llm_service.get_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model="gpt-4o" # Expert model for planning
            )

            if not content:
                return None

            # Parse JSON from content (handle potential markdown formatting)
            json_str = content.strip()
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0].strip()

            plan_data = json.loads(json_str)
            return GoalPlan(**plan_data)

        except Exception as e:
            logger.error(f"Planning failed: {e}")
            return None

planner_service = PlannerService()
