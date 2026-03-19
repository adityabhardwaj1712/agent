import logging
from typing import List, Dict, Any
import uuid

logger = logging.getLogger(__name__)

class SkillLibraryService:
    """
    Modular capabilities (skills) that agents can install.
    """
    def __init__(self):
        self.skills = {
            "web_search": {"name": "Web Search", "description": "Browse the internet for real-time data."},
            "code_interpreter": {"name": "Code Interpreter", "description": "Execute Python code in a sandbox."},
            "image_gen": {"name": "Image Generation", "description": "Generate visual assets via DALL-E."}
        }

    def get_available_skills(self) -> Dict[str, Any]:
        return self.skills

    async def install_skill(self, agent_id: str, skill_key: str, user_id: str = None):
        """Persists a skill mapping for an agent using Redis."""
        if skill_key not in self.skills:
            raise ValueError("Skill not found in library.")
        
        from ..db.redis_client import get_redis_client
        redis = await get_redis_client()
        
        # Key: agent_skills:{agent_id}
        await redis.sadd(f"agent_skills:{agent_id}", skill_key)
        
        logger.info(f"Installed skill {skill_key} to agent {agent_id}")
        return {"status": "installed", "skill": self.skills[skill_key]}

    async def get_agent_skills(self, agent_id: str) -> List[Dict[str, Any]]:
        """Retrieves installed skills for an agent."""
        from ..db.redis_client import get_redis_client
        redis = await get_redis_client()
        
        skill_keys = await redis.smembers(f"agent_skills:{agent_id}")
        return [self.skills[k] for k in skill_keys if k in self.skills]

skill_library = SkillLibraryService()
