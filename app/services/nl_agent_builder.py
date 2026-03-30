import json
import logging
from typing import Optional
from .axon_service import AxonService
from ..schemas.agent_schema import AgentCreate

logger = logging.getLogger(__name__)

class NLAgentBuilder:
    async def build_from_prompt(self, prompt: str, user_id: str) -> Optional[AgentCreate]:
        """
        Uses LLM reasoning to translate a natural language description into a structured Agent configuration.
        """
        system_prompt = """You are the AgentCloud Architect.
Your task is to parse a user's request for a new AI agent and return a VALID JSON object matching the AgentCreate schema.

SCHEMA:
{
  "name": "string (unique identifier)",
  "role": "string (professional title)",
  "description": "string (detailed mission and capabilities)",
  "personality_config": "stringified JSON (e.g. {\"tone\":\"formal\"})",
  "model_name": "string (default: 'gpt-4o')",
  "base_cost": "float (default: 0.01)",
  "scopes": ["list", "of", "capabilities"]
}

AVAILABLE SCOPES: READ_MEMORY, WRITE_MEMORY, RUN_TASKS, SEND_PROTOCOL, WEB_SEARCH, CODE_EXECUTION

REPLY ONLY WITH THE JSON OBJECT.
"""
        user_prompt = f"USER REQUEST: {prompt}"

        try:
            raw_json, _, _, _ = await AxonService.advanced_reasoning(
                task_payload="Build Agent Configuration",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )

            # Clean up the output if the LLM included markdown blocks
            clean_json = raw_json.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:-3].strip()
            elif clean_json.startswith("```"):
                clean_json = clean_json[3:-3].strip()

            data = json.loads(clean_json)
            data["owner_id"] = user_id # Ensure owner is set
            return AgentCreate(**data)
            
        except Exception as e:
            logger.error(f"NL Agent Build failed: {e}")
            return None

nl_agent_builder = NLAgentBuilder()
