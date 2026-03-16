from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable


class Scope:
    READ_MEMORY = "READ_MEMORY"
    WRITE_MEMORY = "WRITE_MEMORY"
    RUN_TASKS = "RUN_TASKS"
    SEND_PROTOCOL = "SEND_PROTOCOL"


def parse_scopes(raw: str | None) -> set[str]:
    if not raw:
        return set()
    return {s.strip() for s in raw.split(",") if s.strip()}


@dataclass(frozen=True)
class CurrentAgent:
    agent_id: str
    scopes: set[str]


def has_scopes(current: CurrentAgent, required: Iterable[str]) -> bool:
    req = set(required)
    return req.issubset(current.scopes)

