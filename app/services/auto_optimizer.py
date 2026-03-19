import logging
from typing import Dict, Any, List
from .axon_service import AxonService

logger = logging.getLogger(__name__)

class AutoOptimizerService:
    """
    Analyzes agent performance and automatically suggests/applies prompt improvements.
    """
    async def optimize_agent(self, agent_id: str, success_history: List[Dict[str, Any]]):
        """
        Analyzes past successes/failures to optimize the agent's system prompt.
        """
        logger.info(f"Optimizing agent {agent_id} based on {len(success_history)} events.")
        
        # Get last 10 items
        recent_history = success_history[-10:] if len(success_history) > 10 else success_history
        history_summary = "\n".join([
            f"Task: {h['payload'][:50]}... | Status: {h['status']}" 
            for h in recent_history
        ])

        system_prompt = """You are an Agent Performance Optimizer.
Analyze the execution history and suggest a more effective system prompt for this agent.
FOCUS ON: Clarity, handling edge cases, and tool usage accuracy.

REPLY ONLY WITH THE NEW PROMPT TEXT.
"""
        user_prompt = f"CURRENT HISTORY:\n{history_summary}"

        try:
            new_prompt, _, _, _ = await AxonService.advanced_reasoning(
                task_payload="Optimization",
                context="",
                tools=None,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
            if new_prompt:
                logger.info(f"Generated optimization for {agent_id}.")
                return new_prompt
        except Exception as e:
            logger.error(f"Optimization failed: {e}")
            return None

auto_optimizer = AutoOptimizerService()
