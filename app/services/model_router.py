import os
import logging
from dataclasses import dataclass
from typing import Optional
from openai import OpenAI
from ..config import settings

logger = logging.getLogger(__name__)

@dataclass(frozen=True)
class ModelChoice:
    name: str
    reason: str
    provider: str

def select_model(payload: str) -> ModelChoice:
    """Pick a model name based on the task payload, with LLM fallback."""
    text = (payload or "").lower()
    
    # 1. Heuristic Override (Fast & Cheap)
    if any(k in text for k in ("cheap", "bulk", "batch")):
        return ModelChoice(name="gpt-4o-mini", reason="cost-optimised batch task", provider="OpenAI")

    # 2. LLM-based Routing (Precise)
    client = OpenAI(api_key=settings.OPENAI_API_KEY) if getattr(settings, "OPENAI_API_KEY", None) else None
    
    if client:
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Route the following task to either 'gpt-4o' (expert) or 'gpt-4o-mini' (standard). Return ONLY the model name."},
                    {"role": "user", "content": payload}
                ],
                max_tokens=10
            )
            model_name = response.choices[0].message.content.strip().lower()
            if model_name in ["gpt-4o", "gpt-4o-mini"]:
                return ModelChoice(name=model_name, reason="LLM-based smart routing", provider="OpenAI")
        except Exception as e:
            logger.error(f"LLM Routing failed: {e}")

    # 3. Static Fallback Logic (Neutrality Law)
    if "claude" in text:
        return ModelChoice(name="claude-3-sonnet", reason="explicit provider request", provider="Anthropic")
    if "gemini" in text:
        return ModelChoice(name="gemini-1.5-pro", reason="explicit provider request", provider="Google")
        
    if any(k in text for k in ("code", "bug", "refactor", "complex", "reason")):
        return ModelChoice(name="gpt-4o", reason="coding or complex reasoning task", provider="OpenAI")
        
    return ModelChoice(name="gpt-4o-mini", reason="standard task fallback", provider="OpenAI")

