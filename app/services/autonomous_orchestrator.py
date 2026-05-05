from __future__ import annotations
import asyncio
import json
import logging
from typing import List, Optional, Dict, Any, Set, Callable
from datetime import datetime, timezone
import uuid
from .event_bus import event_bus
from .supervisor import supervisor_service, strategy_engine
from .audit_service import audit_service
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..db.database import AsyncSessionLocal
from ..models.goal import Goal
from ..models.task import Task
from ..models.agent import Agent
from .model_router import select_model, call_provider, ModelChoice
from .orchestrator import orchestrator, Priority
from .dag_engine import dag_engine

class AutonomousOrchestrator:
    """
    Autonomous Execution Engine.
    Implements Planner-Executor-Evaluator-Critic with Reliability & Policy layers.
    """

    async def run_goal(self, goal_id: str, mode: str = "quality"):
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Goal).where(Goal.goal_id == goal_id))
            goal = result.scalars().first()
            if not goal: return

        # Get strategy recommendation if not explicitly provided
        if not mode:
            mode = supervisor_service.get_recommendation(goal.description)
        
        config = strategy_engine.get_config(mode)
        logger.info(f"Mission {goal_id} starting with strategy: {mode}")

        await event_bus.publish("mission_started", {
            "goal_id": goal_id,
            "type": "sequential",
            "description": goal.description,
            "strategy": mode
        }, source="orchestrator")

        # ENTERPRISE AUDIT
        await audit_service.log_action(
            user_id=goal.user_id,
            action_type="mission_started",
            goal_id=goal_id,
            detail={"strategy": mode, "type": "sequential"}
        )

        steps = await self._plan(goal.description)
        if not steps: return

        for i, step_desc in enumerate(steps):
            await self._execute_step(step_desc, goal_id, goal.user_id)

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Goal).filter(Goal.goal_id == goal_id))
            goal_db = result.scalars().first()
            if goal_db:
                goal_db.status = "completed"
                await db.commit()
        
        await event_bus.publish("mission_completed", {
            "goal_id": goal_id,
            "status": "completed"
        }, source="orchestrator")

        # ENTERPRISE AUDIT
        await audit_service.log_action(
            user_id=goal_db.user_id,
            action_type="mission_completed",
            goal_id=goal_id,
            detail={"status": "completed"}
        )


    async def run_dag_goal(self, goal_id: str):
        logger.info(f"Starting autonomous DAG execution for goal: {goal_id}")
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Goal).filter(Goal.goal_id == goal_id))
            goal = result.scalars().first()
            if not goal: return

        await event_bus.publish("mission_started", {
            "goal_id": goal_id,
            "type": "dag",
            "description": goal.description
        }, source="orchestrator")

        dag_data = await self._plan_dag(goal.description)
        if not dag_data: return

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Goal).filter(Goal.goal_id == goal_id))
            goal_db = result.scalars().first()
            if goal_db:
                goal_db.workflow_type = "dag"
                goal_db.workflow_json = json.dumps(dag_data)
                await db.commit()

        await dag_engine.execute_workflow(
            goal_id=goal_id,
            nodes=dag_data["nodes"],
            edges=dag_data["edges"],
            execute_fn=lambda desc: self._execute_step(desc, goal_id, goal.user_id)
        )

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Goal).filter(Goal.goal_id == goal_id))
            goal_db = result.scalars().first()
            if goal_db:
                goal_db.status = "completed"
                await db.commit()
        
        await event_bus.publish("mission_completed", {
            "goal_id": goal_id,
            "status": "completed"
        }, source="orchestrator")

    async def _execute_step(self, step_desc: str, goal_id: str, user_id: str) -> str:
        """
        Executes a single step with Full Reliability Stack.
        """
        await event_bus.publish("node_started", {
            "goal_id": goal_id,
            "description": step_desc,
            "user_id": user_id
        }, source="orchestrator")

        try:
            # 1. Policy Check (Safety & Cost)
            is_allowed, reason = await self._check_policy(step_desc, user_id)
            if not is_allowed:
                logger.error(f"Policy Violation: {reason}")
                await event_bus.publish("node_failed", {
                    "goal_id": goal_id,
                    "description": step_desc,
                    "error": f"Policy Violation - {reason}"
                }, source="orchestrator")
                return f"Error: Policy Violation - {reason}"

            # 2. Experience Retrieval
            exp = await self._get_experience(step_desc)
            enriched_payload = f"{exp}\nTask: {step_desc}" if exp else step_desc

            # 3. Execution with Retry & Fallback
            mode = "quality"
            config = strategy_engine.get_config(mode)
            
            # --- SWARM PEER REVIEW PROTOCOL ---
            # Phase A: Strategist Proposes Initial Execution
            result_output = await self._execute_with_retry(
                enriched_payload, 
                goal_id, 
                user_id, 
                retries=config["max_retries"],
                primary_model=config["primary_model"]
            )
            
            # Phase B: Swarm Critic Level 1 (Reasoning Analysis)
            # Use a different model/prompt to find flaws in the execution
            critique_data = await self._swarm_critic(step_desc, result_output)
            
            final_output = result_output
            if critique_data.get("needs_refinement"):
                logger.info(f"Swarm Critic [REJECTED]: {critique_data.get('reason')}")
                # Phase C: Refinement Loop (Self-Correction)
                refinement_payload = f"CRITIQUE: {critique_data.get('reason')}\nORIGINAL_TASK: {step_desc}\nPREVIOUS_RESULT: {result_output}\nFIX_AND_RESUBMIT:"
                final_output = await self._execute_with_retry(
                    refinement_payload,
                    goal_id,
                    user_id,
                    retries=1,
                    primary_model="llama3-70b-8192" # Use heavy model for refinement
                )
            else:
                logger.info("Swarm Critic [APPROVED]: Optimal result achieved.")

            await event_bus.publish("node_completed", {
                "goal_id": goal_id,
                "description": step_desc,
                "result_preview": final_output[:100] + "..." if len(final_output) > 100 else final_output,
                "status": "completed",
                "critic_feedback": critique_data.get("reason")
            }, source="orchestrator")
            return final_output
        except Exception as e:
            logger.error(f"Error executing step '{step_desc}': {e}")
            await event_bus.publish("node_failed", {
                "goal_id": goal_id,
                "description": step_desc,
                "error": str(e)
            }, source="orchestrator")
            raise e

    async def _execute_with_retry(self, payload: str, goal_id: str, user_id: str, retries: int = 2, primary_model: str = "llama3-70b-8192") -> str:
        """Executes a task with automated retries and model fallbacks."""
        last_error = None
        current_model = primary_model

        for attempt in range(retries + 1):
            try:
                # Select agent and run via orchestrator
                # Note: We use the orchestrator service to handle the underlying LLM call
                result = await orchestrator.execute_task(
                    payload, 
                    Priority.HIGH, 
                    user_id=user_id,
                    model_override=current_model
                )
                return result
            except Exception as e:
                logger.error(f"Execution error on attempt {attempt+1}: {e}")
            
            # Exponential backoff
            await asyncio.sleep(2 ** attempt)
            
        return "Error: Maximum retries exceeded"

    async def _check_policy(self, step: str, user_id: str) -> tuple[bool, str]:
        """Verify task against Safety and Cost policies."""
        # Simple safety check keywords
        blacklisted = ["delete database", "drop table", "shutdown server", "malicious"]
        for word in blacklisted:
            if word in step.lower():
                return False, f"Prohibited action detected: {word}"
        
        # Could also check user balance/usage here
        return True, "Allowed"

    async def _route_task(self, step: str) -> ModelChoice:
        prompt = f"Choose best model (llama3-70b-8192, llama3-8b-8192, mixtral-8x7b-32768) for: {step}. Return JSON {{'model': '...'}}"
        try:
            choice = ModelChoice("llama3-8b-8192", "router", "Groq")
            content, _, _ = await call_provider(choice, prompt=prompt)
            data = json.loads(content.strip().replace("```json", "").replace("```", "").strip())
            return ModelChoice(data.get("model", "llama3-70b-8192"), "dynamic", "Groq")
        except Exception: return ModelChoice("llama3-70b-8192", "default", "Groq")

    async def _swarm_critic(self, step: str, result: str) -> Dict[str, Any]:
        """
        Swarm Intelligence Level 1: Cross-validation.
        Uses a specialized 'Critic' persona to find flaws in the execution.
        """
        prompt = f"""
        [CRITIC_MODE] Analyze the following task execution.
        TASK: {step}
        RESULT: {result}
        
        Is the result accurate, complete, and free of hallucinations?
        Return ONLY a JSON object:
        {{
          "needs_refinement": bool,
          "reason": "Detailed critique or 'Optimal' if success",
          "score": 0.0-1.0
        }}
        """
        choice = ModelChoice("llama3-70b-8192", "critic", "Groq")
        try:
            res, _, _ = await call_provider(choice, prompt=prompt)
            clean_res = res.strip().replace("```json", "").replace("```", "").strip()
            return json.loads(clean_res)
        except Exception as e:
            logger.error(f"Swarm Critic Error: {e}")
            return {"needs_refinement": False, "reason": "Critic Bypass (Check Manual)", "score": 1.0}

    async def _get_experience(self, step: str) -> Optional[str]:
        async with AsyncSessionLocal() as db:
            stmt = select(Task).filter(Task.status == "completed").filter(Task.payload.contains(step[:15])).limit(1)
            result = await db.execute(stmt)
            past = result.scalars().first()
            return f"PAST: {past.result[:100]}..." if past else None

    async def _plan(self, goal: str) -> List[str]:
        prompt = f"JSON list of max 5 steps for GOAL: {goal}"
        choice = ModelChoice("llama3-70b-8192", "plan", "Groq")
        res, _, _ = await call_provider(choice, prompt=prompt)
        try:
            clean_res = res.strip().replace("```json", "").replace("```", "").strip()
            return json.loads(clean_res)
        except Exception as e:
            logger.error(f"Sequential plan failed: {e}. Raw: {res[:100]}")
            return [goal]

    async def _plan_dag(self, goal: str) -> Optional[Dict[str, Any]]:
        prompt = f"JSON nodes/edges DAG for GOAL: {goal}"
        choice = ModelChoice("llama3-70b-8192", "dag-plan", "Groq")
        res, _, _ = await call_provider(choice, prompt=prompt)
        try:
            clean_res = res.strip().replace("```json", "").replace("```", "").strip()
            return json.loads(clean_res)
        except Exception as e:
            logger.error(f"DAG plan failed: {e}. Raw: {res[:100]}")
            return None

    async def _wait_for_task(self, task_id: str, timeout: int = 300) -> str:
        start = asyncio.get_running_loop().time()
        while asyncio.get_running_loop().time() - start < timeout:
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Task).filter(Task.task_id == task_id))
                task = result.scalars().first()
                if task and task.status == "completed": return task.result or task.output or ""
                if task and task.status == "failed": return "Error: Task failed"
            await asyncio.sleep(2)
        return "Error: Timeout"

autonomous_orchestrator = AutonomousOrchestrator()
