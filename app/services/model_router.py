from ..core.llm import llm_service
from ..config import settings

logger = logging.getLogger(__name__)

@dataclass(frozen=True)
class ModelChoice:
    name: str
    reason: str
    provider: str

def select_model(payload: str) -> ModelChoice:
    """Pick a model name based on the task payload."""
    text = (payload or "").lower()
    
    # 1. Heuristic Override (Fast & Cheap)
    if any(k in text for k in ("cheap", "bulk", "batch")):
        return ModelChoice(name="gpt-4o-mini", reason="cost-optimised batch task", provider="OpenAI")

    # 2. Static Fallback Logic (Neutrality Law)
    if any(k in text for k in ("code", "bug", "refactor", "complex", "reason")):
        return ModelChoice(name="gpt-4o", reason="coding or complex reasoning task", provider="OpenAI")
        
    return ModelChoice(name="gpt-4o-mini", reason="standard task fallback", provider="OpenAI")

async def call_provider(choice: ModelChoice, prompt: str = None, context: str = "", tools: list = None, messages: list = None) -> tuple[str, list, Any]:
    """
    AXON Resiliency: Executes LLM call using llm_service with fallback.
    """
    if messages is None:
        system_prompt = f"You are an autonomous agent within the AgentCloud ecosystem. Use the provided context to fulfill the user request concisely.\n\nCONTEXT:\n{context}"
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
    
    # 1. Primary Attempt
    try:
        content, tool_calls, usage = await llm_service.get_completion(
            messages=messages,
            model=choice.name,
            tools=tools
        )
        return content or "", tool_calls or [], usage
    except Exception as e:
        logger.warning(f"Primary LLM attempt failed: {e}. Retrying with fallback gpt-4o-mini.")
        
    # 2. Resiliency Fallback
    try:
        content, tool_calls, usage = await llm_service.get_completion(
            messages=messages,
            model="gpt-4o-mini",
            tools=tools
        )
        return content or "", tool_calls or [], usage
    except Exception as e:
        logger.error(f"Critical LLM Failure: {e}")
        return f"AXON Critical Failure: {str(e)[:100]}", [], None
