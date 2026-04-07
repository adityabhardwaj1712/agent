from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, List, Optional, Tuple

from ..core.llm import llm_service
from ..config import settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ModelChoice:
    name: str
    reason: str
    provider: str


# Ordered fallback chains per use-case
_FALLBACK_CHAINS: dict[str, list[ModelChoice]] = {
    "code": [
        ModelChoice("claude-sonnet-4-6", "best-in-class coding", "Anthropic"),
        ModelChoice("gpt-4o", "strong code fallback", "OpenAI"),
        ModelChoice("gemini-2.0-flash", "gemini code fallback", "Google"),
    ],
    "analysis": [
        ModelChoice("gpt-4o", "deep analytical reasoning", "OpenAI"),
        ModelChoice("claude-sonnet-4-6", "anthropic analysis fallback", "Anthropic"),
    ],
    "vision": [
        ModelChoice("gemini-2.0-flash-exp", "multimodal leader", "Google"),
        ModelChoice("gpt-4o", "openai vision fallback", "OpenAI"),
    ],
    "bulk": [
        ModelChoice("gpt-4o-mini", "cost-optimised", "OpenAI"),
        ModelChoice("claude-haiku-4-5-20251001", "anthropic cheap fallback", "Anthropic"),
    ],
    "productivity": [
        ModelChoice("claude-sonnet-4-6", "peak developer performance", "Anthropic"),
        ModelChoice("gpt-4o", "openai dev fallback", "OpenAI"),
    ],
    "default": [
        ModelChoice("claude-haiku-4-5-20251001", "fast and capable", "Anthropic"),
        ModelChoice("gpt-4o-mini", "openai cheap fallback", "OpenAI"),
    ],
    "autonomous": [
        ModelChoice("llama3-70b-8192", "high-speed autonomous planning", "Groq"),
        ModelChoice("claude-sonnet-4-6", "complex autonomous fallback", "Anthropic"),
        ModelChoice("gpt-4o", "openai complex fallback", "OpenAI"),
    ]
}


def _available(choice: ModelChoice) -> bool:
    """Check whether the required API key is configured."""
    if choice.provider == "OpenAI":
        return bool(settings.OPENAI_API_KEY)
    if choice.provider == "Anthropic":
        return bool(settings.ANTHROPIC_API_KEY)
    if choice.provider == "Google":
        return bool(settings.GOOGLE_API_KEY)
    if choice.provider == "Groq":
        return bool(settings.GROQ_API_KEY)
    return False


def _detect_task_type(payload: str) -> str:
    text = (payload or "").lower()
    if any(k in text for k in ("cheap", "bulk", "batch", "many", "loop")):
        return "bulk"
    if any(k in text for k in ("image", "screenshot", "photo", "vision", "look at")):
        return "vision"
    if any(k in text for k in ("code", "bug", "refactor", "function", "class", "debug", "implement", "script", "test", "unittest", "pytest", "docstring", "documentation")):
        return "productivity"
    if any(k in text for k in ("analyze", "analyse", "research", "summarize", "review", "explain", "reason", "compare")):
        return "analysis"
    return "default"


def select_model(payload: str) -> ModelChoice:
    """Pick the best available model for this payload."""
    task_type = _detect_task_type(payload)
    chain = _FALLBACK_CHAINS[task_type]
    for choice in chain:
        if _available(choice):
            logger.debug(f"Model selected: {choice.name} ({choice.reason})")
            return choice
    # Last resort: first model in the chain regardless
    logger.warning("No API keys configured ? using first model in chain (will fail without keys)")
    return chain[0]


async def call_provider(
    choice: ModelChoice,
    prompt: str = None,
    context: str = "",
    tools: list = None,
    messages: list = None,
    task_id: Optional[str] = None,
) -> Tuple[str, list, Any]:
    """
    Execute an LLM call with automatic fallback across providers.
    Returns (content, tool_calls, usage).
    """
    if messages is None:
        system = (
            "You are an autonomous agent within the AgentCloud ecosystem. "
            "Use the provided context to fulfil the user request concisely.\n\n"
            f"CONTEXT:\n{context}"
        )
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ]

    task_type = _detect_task_type(prompt or "")
    chain = _FALLBACK_CHAINS[task_type]

    # Build a prioritised attempt list: chosen model first, then rest of chain
    attempt_order: List[ModelChoice] = [choice]
    for c in chain:
        if c.name != choice.name and _available(c):
            attempt_order.append(c)

    last_error: Exception = RuntimeError("No models attempted")
    for attempt in attempt_order:
        try:
            content, tool_calls, usage = await llm_service.get_completion(
                messages=messages,
                model=attempt.name,
                tools=tools,
                task_id=task_id,
            )
            if attempt.name != choice.name:
                logger.info(f"Fell back to {attempt.name} after primary failed")
            return content or "", tool_calls or [], usage
        except Exception as exc:
            logger.warning(f"Provider {attempt.provider} / {attempt.name} failed: {exc}")
            last_error = exc

    logger.error(f"All providers exhausted: {last_error}")
    return f"AXON Critical Failure ? all providers exhausted: {last_error!s:.120}", [], None
