import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class PersonalityService:
    """
    Manages agent personas, tones, and behavioral constraints.
    """
    def generate_system_prompt(self, agent_name: str, base_role: str, config_json: Optional[str]) -> str:
        """
        Combines base role with personality traits to create a rich system prompt.
        """
        prompt = f"You are {agent_name}, a {base_role}."
        
        if not config_json:
            return prompt

        try:
            config = json.loads(config_json)
            tone = config.get("tone", "professional")
            persona = config.get("persona", "")
            constraints = config.get("constraints", [])

            prompt += f"\nTONE: {tone}"
            if persona:
                prompt += f"\nPERSONA: {persona}"
            if constraints:
                prompt += f"\nCONSTRAINTS:\n- " + "\n- ".join(constraints)
        except Exception as e:
            logger.error(f"Failed to parse personality config: {e}")

        return prompt

personality_service = PersonalityService()
