from __future__ import annotations

import asyncio
import json
import time
from enum import Enum
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional
from loguru import logger

from ..db.redis_client import get_async_redis_client


class CircuitState(str, Enum):
    CLOSED    = "closed"       # Normal operation
    OPEN      = "open"         # Paused — rejecting tasks
    HALF_OPEN = "half_open"    # Recovery probe


@dataclass
class CircuitStats:
    agent_id: str
    state: CircuitState
    consecutive_failures: int = 0
    total_failures: int = 0
    total_successes: int = 0
    last_failure_time: float = 0.0
    last_state_change: float = 0.0
    cooldown_seconds: int = 300          # 5 min default
    failure_threshold: int = 3           # failures before OPEN
    quality_threshold: float = 0.3       # avg quality below this → OPEN
    quality_window: int = 5              # tasks to average for quality check


class CircuitBreaker:
    _KEY_PREFIX = "circuit:"

    def _stats_key(self, agent_id: str) -> str:
        return f"{self._KEY_PREFIX}{agent_id}:stats"

    def _quality_key(self, agent_id: str) -> str:
        return f"{self._KEY_PREFIX}{agent_id}:quality"

    async def _get_stats(self, agent_id: str) -> CircuitStats:
        redis = await get_async_redis_client()
        raw = await redis.get(self._stats_key(agent_id))
        if raw:
            data = json.loads(raw)
            data["state"] = CircuitState(data["state"])
            return CircuitStats(**data)
        return CircuitStats(agent_id=agent_id, state=CircuitState.CLOSED)

    async def _save_stats(self, stats: CircuitStats):
        redis = await get_async_redis_client()
        data = asdict(stats)
        data["state"] = stats.state.value
        await redis.set(self._stats_key(stats.agent_id), json.dumps(data), ex=86400)

    async def allow_request(self, agent_id: str) -> bool:
        stats = await self._get_stats(agent_id)
        now = time.time()

        if stats.state == CircuitState.CLOSED:
            return True

        if stats.state == CircuitState.OPEN:
            if now - stats.last_failure_time >= stats.cooldown_seconds:
                stats.state = CircuitState.HALF_OPEN
                stats.last_state_change = now
                await self._save_stats(stats)
                logger.info(f"Circuit for agent {agent_id}: OPEN → HALF_OPEN (probe)")
                await self._notify_state_change(agent_id, CircuitState.HALF_OPEN)
                return True    # Allow the probe task
            return False       # Still in cooldown

        if stats.state == CircuitState.HALF_OPEN:
            return True        # Allow probe

        return True

    async def record_success(self, agent_id: str, quality_score: float = 1.0):
        stats = await self._get_stats(agent_id)
        stats.consecutive_failures = 0
        stats.total_successes += 1

        await self._push_quality(agent_id, quality_score)

        if stats.state == CircuitState.HALF_OPEN:
            stats.state = CircuitState.CLOSED
            stats.cooldown_seconds = 300    # Reset cooldown
            stats.last_state_change = time.time()
            logger.info(f"Circuit for agent {agent_id}: HALF_OPEN → CLOSED (recovered)")
            await self._notify_state_change(agent_id, CircuitState.CLOSED)

        await self._save_stats(stats)

    async def record_failure(self, agent_id: str, error: str = "", quality_score: float = 0.0):
        stats = await self._get_stats(agent_id)
        stats.consecutive_failures += 1
        stats.total_failures += 1
        stats.last_failure_time = time.time()

        await self._push_quality(agent_id, quality_score)

        should_open = False
        reason = ""

        if stats.consecutive_failures >= stats.failure_threshold:
            should_open = True
            reason = f"{stats.consecutive_failures} consecutive failures"

        avg_quality = await self._avg_quality(agent_id, stats.quality_window)
        if avg_quality < stats.quality_threshold:
            should_open = True
            reason = f"avg quality {avg_quality:.2f} < {stats.quality_threshold}"

        if should_open:
            if stats.state == CircuitState.HALF_OPEN:
                stats.cooldown_seconds = min(stats.cooldown_seconds * 2, 3600)  # exponential backoff
            stats.state = CircuitState.OPEN
            stats.last_state_change = time.time()
            logger.warning(f"Circuit for agent {agent_id}: OPEN — {reason}")
            await self._notify_state_change(agent_id, CircuitState.OPEN, reason)

        await self._save_stats(stats)

    async def force_state(self, agent_id: str, state: CircuitState):
        stats = await self._get_stats(agent_id)
        old_state = stats.state
        stats.state = state
        stats.last_state_change = time.time()
        if state == CircuitState.CLOSED:
            stats.consecutive_failures = 0
        await self._save_stats(stats)
        logger.info(f"Circuit for agent {agent_id}: {old_state} → {state} (manual override)")

    async def get_all_circuit_stats(self) -> List[dict]:
        redis = await get_async_redis_client()
        keys = await redis.keys(f"{self._KEY_PREFIX}*:stats")
        result = []
        for key in keys:
            raw = await redis.get(key)
            if raw:
                data = json.loads(raw)
                data["avg_quality"] = await self._avg_quality(data["agent_id"], 5)
                result.append(data)
        return result

    async def _push_quality(self, agent_id: str, score: float):
        redis = await get_async_redis_client()
        key = self._quality_key(agent_id)
        await redis.lpush(key, score)
        await redis.ltrim(key, 0, 99)       # Keep last 100 scores

    async def _avg_quality(self, agent_id: str, window: int) -> float:
        redis = await get_async_redis_client()
        scores = await redis.lrange(self._quality_key(agent_id), 0, window - 1)
        if not scores:
            return 1.0
        return sum(float(s) for s in scores) / len(scores)

    async def _notify_state_change(
        self, agent_id: str, new_state: CircuitState, reason: str = ""
    ):
        try:
            from ..services.slack_service import slack_service
            emoji = {"closed": "✅", "open": "🔴", "half_open": "🟡"}.get(new_state.value, "⚪")
            await slack_service.send_notification(
                f"{emoji} *Circuit Breaker* — Agent `{agent_id[:8]}`\n"
                f"State: `{new_state.value.upper()}`"
                + (f"\nReason: {reason}" if reason else "")
            )
        except Exception as exc:
            logger.warning(f"Circuit breaker Slack alert failed: {exc}")


DLQ_STREAM = "agentcloud:dlq"

async def send_to_dlq(task_dict: dict, reason: str = "circuit_open"):
    redis = await get_async_redis_client()
    await redis.xadd(DLQ_STREAM, {
        "task_id": task_dict.get("task_id", ""),
        "agent_id": task_dict.get("agent_id", ""),
        "payload": task_dict.get("payload", "")[:500],
        "reason": reason,
        "timestamp": str(time.time()),
        "task_json": json.dumps(task_dict),
    }, maxlen=10_000)
    logger.warning(f"Task {task_dict.get('task_id')} → DLQ (reason: {reason})")


async def replay_dlq(limit: int = 10) -> List[dict]:
    redis = await get_async_redis_client()
    entries = await redis.xrange(DLQ_STREAM, count=limit)
    replayed = []
    for entry_id, data in entries:
        try:
            from .orchestrator import orchestrator
            from arq import create_pool
            from arq.connections import RedisSettings
            import os

            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
            arq_pool = await create_pool(RedisSettings.from_dsn(redis_url))
            await arq_pool.enqueue_job('run_agent_task', task_dict, _job_id=task_dict.get("task_id"))
            replayed.append(task_dict.get("task_id"))
        except Exception as exc:
            logger.error(f"DLQ replay failed for {entry_id}: {exc}")
    return replayed


circuit_breaker = CircuitBreaker()
