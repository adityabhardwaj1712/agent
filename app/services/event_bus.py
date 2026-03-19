from __future__ import annotations

import asyncio
import json
import time
import uuid
from dataclasses import dataclass, asdict
from typing import Any, Callable, Dict, List, Optional, Awaitable
from loguru import logger

from ..db.redis_client import get_async_redis_client


STREAM_KEY = "agentcloud:event_bus"
DLQ_KEY = "agentcloud:event_bus:dlq"
MAX_STREAM_LEN = 100_000          # Trim stream to last 100k events


# ─── Event model ──────────────────────────────────────────────────────────────

@dataclass
class AgentEvent:
    event_id: str
    event_type: str           # e.g. "task.completed", "agent.message", "goal.progress"
    publisher_agent_id: str
    payload: Dict[str, Any]
    timestamp: float
    correlation_id: Optional[str] = None   # link related events
    user_id: Optional[str] = None

    @classmethod
    def create(cls, event_type: str, publisher_agent_id: str, payload: dict,
               user_id: str = None, correlation_id: str = None) -> "AgentEvent":
        return cls(
            event_id=str(uuid.uuid4()),
            event_type=event_type,
            publisher_agent_id=publisher_agent_id,
            payload=payload,
            timestamp=time.time(),
            correlation_id=correlation_id or str(uuid.uuid4()),
            user_id=user_id,
        )

    def to_redis(self) -> dict:
        return {k: json.dumps(v) if isinstance(v, dict) else str(v)
                for k, v in asdict(self).items() if v is not None}

    @classmethod
    def from_redis(cls, data: dict) -> "AgentEvent":
        return cls(
            event_id=data["event_id"],
            event_type=data["event_type"],
            publisher_agent_id=data["publisher_agent_id"],
            payload=json.loads(data.get("payload", "{}")),
            timestamp=float(data["timestamp"]),
            correlation_id=data.get("correlation_id"),
            user_id=data.get("user_id"),
        )


# ─── Subscription registry ────────────────────────────────────────────────────

Handler = Callable[[AgentEvent], Awaitable[None]]

class _Subscription:
    def __init__(self, pattern: str, handler: Handler, subscriber_id: str):
        self.pattern = pattern          # "task.*" or exact "task.completed"
        self.handler = handler
        self.subscriber_id = subscriber_id

    def matches(self, event_type: str) -> bool:
        if self.pattern == "*":
            return True
        if self.pattern.endswith(".*"):
            prefix = self.pattern[:-2]
            return event_type == prefix or event_type.startswith(prefix + ".")
        return self.pattern == event_type


# ─── Event Bus ────────────────────────────────────────────────────────────────

class AgentEventBus:
    def __init__(self):
        self._subscriptions: List[_Subscription] = []
        self._consumer_group = "agentcloud_workers"
        self._consumer_name = f"worker_{uuid.uuid4().hex[:8]}"
        self._running = False

    def subscribe(self, pattern: str, agent_id: str = "system"):
        """Decorator to register an event handler."""
        def decorator(func: Handler):
            sub = _Subscription(pattern=pattern, handler=func, subscriber_id=agent_id)
            self._subscriptions.append(sub)
            logger.info(f"Agent '{agent_id}' subscribed to pattern '{pattern}'")
            return func
        return decorator

    def add_subscription(self, pattern: str, handler: Handler, agent_id: str = "system"):
        """Programmatic subscription (non-decorator)."""
        self._subscriptions.append(_Subscription(pattern, handler, agent_id))

    async def publish(self, event: AgentEvent) -> str:
        """Publish an event to the stream. Returns the stream entry ID."""
        redis = await get_async_redis_client()
        entry_id = await redis.xadd(
            STREAM_KEY,
            event.to_redis(),
            maxlen=MAX_STREAM_LEN,
            approximate=True,
        )
        logger.debug(f"Published {event.event_type} from {event.publisher_agent_id} → {entry_id}")
        return entry_id

    async def publish_simple(
        self,
        event_type: str,
        publisher_agent_id: str,
        payload: dict,
        user_id: str = None,
        correlation_id: str = None,
    ) -> str:
        """Convenience wrapper."""
        event = AgentEvent.create(
            event_type=event_type,
            publisher_agent_id=publisher_agent_id,
            payload=payload,
            user_id=user_id,
            correlation_id=correlation_id,
        )
        return await self.publish(event)

    async def _ensure_consumer_group(self):
        redis = await get_async_redis_client()
        try:
            await redis.xgroup_create(STREAM_KEY, self._consumer_group, id="0", mkstream=True)
        except Exception:
            pass  # Group already exists

    async def start_consuming(self):
        await self._ensure_consumer_group()
        self._running = True
        redis = await get_async_redis_client()
        logger.info(f"Event bus consumer '{self._consumer_name}' started")

        while self._running:
            try:
                entries = await redis.xreadgroup(
                    groupname=self._consumer_group,
                    consumername=self._consumer_name,
                    streams={STREAM_KEY: ">"},
                    count=10,
                    block=2000,       # block up to 2s waiting for new events
                )
                if not entries:
                    continue

                for _stream, messages in entries:
                    for entry_id, data in messages:
                        await self._dispatch(entry_id, data, redis)

            except Exception as exc:
                logger.error(f"Event bus consumer error: {exc}")
                await asyncio.sleep(2)

    async def _dispatch(self, entry_id: str, data: dict, redis):
        try:
            event = AgentEvent.from_redis(data)
        except Exception as exc:
            logger.error(f"Failed to parse event {entry_id}: {exc}")
            await redis.xack(STREAM_KEY, self._consumer_group, entry_id)
            return

        matching = [s for s in self._subscriptions if s.matches(event.event_type)]

        if not matching:
            logger.debug(f"No subscribers for event type '{event.event_type}' — DLQ")
            await redis.xadd(DLQ_KEY, {"entry_id": entry_id, **data})
        else:
            async def _call(sub: _Subscription):
                try:
                    await sub.handler(event)
                except Exception as exc:
                    logger.error(f"Subscriber '{sub.subscriber_id}' failed on {event.event_type}: {exc}")

            await asyncio.gather(*[_call(s) for s in matching], return_exceptions=True)

        await redis.xack(STREAM_KEY, self._consumer_group, entry_id)

    def stop(self):
        self._running = False

    async def get_stream_info(self) -> dict:
        redis = await get_async_redis_client()
        length = await redis.xlen(STREAM_KEY)
        dlq_len = await redis.xlen(DLQ_KEY)
        try:
            groups = await redis.xinfo_groups(STREAM_KEY)
            lag = groups[0].get("lag", 0) if groups else 0
        except Exception:
            lag = 0
        return {"stream_length": length, "pending_lag": lag, "dlq_size": dlq_len}


event_bus = AgentEventBus()


async def agent_delegate(
    from_agent_id: str,
    to_agent_id: str,
    task_payload: str,
    user_id: str,
    await_result: bool = False,
    timeout: int = 60,
) -> dict:
    from ..services.task_service import send_task
    from ..schemas.task_schema import TaskCreate
    from ..db.database import AsyncSessionLocal

    correlation_id = str(uuid.uuid4())

    async with AsyncSessionLocal() as db:
        result = await send_task(
            db,
            TaskCreate(payload=task_payload, agent_id=to_agent_id),
            user_id=user_id,
        )
        task_id = result["task_id"]

    await event_bus.publish_simple(
        event_type="agent.delegate",
        publisher_agent_id=from_agent_id,
        payload={"to_agent_id": to_agent_id, "task_id": task_id, "payload": task_payload},
        user_id=user_id,
        correlation_id=correlation_id,
    )

    if not await_result:
        return {"task_id": task_id, "status": "delegated", "correlation_id": correlation_id}

    from ..models.task import Task as TaskModel
    deadline = time.time() + timeout
    while time.time() < deadline:
        await asyncio.sleep(2)
        async with AsyncSessionLocal() as db:
            task = await db.get(TaskModel, task_id)
            if task and task.status in ("completed", "failed"):
                return {
                    "task_id": task_id,
                    "status": task.status,
                    "result": task.result,
                    "correlation_id": correlation_id,
                }
    return {"task_id": task_id, "status": "timeout", "correlation_id": correlation_id}
