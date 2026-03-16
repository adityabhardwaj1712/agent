from __future__ import annotations

"""
Simple model routing layer.

For now this is heuristic and logging-only, but the public API is designed so
that a real implementation (OpenAI, Claude, Gemini, local models, etc.) can
drop in later without changing callers.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class ModelChoice:
    name: str
    reason: str


def select_model(payload: str) -> ModelChoice:
    """Pick a model name based on the task payload."""
    text = (payload or "").lower()

    if any(k in text for k in ("code", "bug", "refactor", "function", "class")):
        return ModelChoice(name="gpt-4o", reason="coding-related task")

    if any(k in text for k in ("summarize", "article", "blog", "email", "write")):
        return ModelChoice(name="claude-3.5", reason="writing / summarization task")

    if any(k in text for k in ("cheap", "bulk", "batch")):
        return ModelChoice(name="llama-3.1-8b", reason="cost-optimised batch task")

    # Default smart choice
    return ModelChoice(name="gpt-4o-mini", reason="generic task")

