import logging
from typing import List, Dict, Any, Optional
from ..services.personality_service import personality_service
from ..services.compliance_service import compliance_service

logger = logging.getLogger(__name__)

class GuardrailService:
    """
    Enforces system-wide prompts and constraints across all agent interactions.
    This is the 'Elite SaaS' central brain for compliance and brand voice.
    """
    GLOBAL_INSTRUCTIONS = [
        "Maintain an elite, tech-startup tone: concise, professional, and action-oriented.",
        "Adhere to AgentCloud Security & Compliance protocols—no PII leaks or malicious commands.",
        "Always optimize for token efficiency and clearly structured responses.",
        "If a tool call fails, explain why and suggest an autonomous recovery path."
    ]

    def apply_universal_guardrails(self, base_prompt: str, agent_personality: Optional[str] = None) -> str:
        """
        Injects global instructions and personality into the final system execution prompt.
        """
        guardrail_block = "\n".join([f"- {instr}" for instr in self.GLOBAL_INSTRUCTIONS])
        
        final_prompt = (
            "### AGENTCLOUD UNIVERSAL GUARDRAILS\n"
            f"{guardrail_block}\n\n"
            "### AGENT PERSONALITY / ROLE\n"
            f"{agent_personality or 'You are a professional AI agent within the AgentCloud ecosystem.'}\n\n"
            "### CURRENT TASK\n"
            f"{base_prompt}"
        )
        
        return final_prompt

guardrail_service = GuardrailService()
