from __future__ import annotations

import asyncio
import json
from typing import Any

import redis.asyncio as aioredis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from loguru import logger
from sqlalchemy.future import select

from ..db.database import AsyncSessionLocal
from ..db.redis_client import get_redis_client
from ..models.task import Task
from ..core.auth_service import verify_token

router = APIRouter(prefix="/ws", tags=["websocket"])


async def _verify_token(token: str) -> str | None:
    """Returns user_id if valid, None otherwise."""
    try:
        payload = verify_token(token)
        return payload.get("user") if payload else None
    except Exception:
        return None


@router.websocket("/tasks/{task_id}")
async def task_stream(
    websocket: WebSocket,
    task_id: str,
    token: str = Query(..., description="Bearer token for auth"),
):
    """
    Stream real-time updates for a task.

    The client connects immediately after submitting a task.
    This endpoint:
      1. Sends the current task status right away.
      2. Subscribes to Redis pub/sub for live trace events from the worker.
      3. Polls the DB every 2 s and pushes status changes.
      4. Closes the connection when the task reaches a terminal state.

    Frontend usage (TypeScript):
        const ws = new WebSocket(`ws://localhost:8000/ws/tasks/${taskId}?token=${jwt}`)
        ws.onmessage = (e) => {
            const msg = JSON.parse(e.data)
            // msg.type: "status" | "trace" | "result" | "error"
        }
    """
    user_id = await _verify_token(token)
    if not user_id:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    await websocket.accept()
    logger.info(f"WS connected task={task_id} user={user_id}")

    redis: aioredis.Redis = aioredis.from_url(
        __import__("os").getenv("REDIS_URL", "redis://localhost:6379/0"),
        decode_responses=True,
    )
    pubsub = redis.pubsub()

    async def send(msg_type: str, data: dict):
        try:
            await websocket.send_text(json.dumps({"type": msg_type, **data}))
        except Exception:
            pass

    try:
        # 1. Send snapshot of current state
        async with AsyncSessionLocal() as db:
            task = await db.get(Task, task_id)
            if task:
                await send("status", {"task_id": task_id, "status": task.status})
            else:
                await send("error", {"message": f"Task {task_id} not found"})
                await websocket.close()
                return

        # 2. Subscribe to trace channel for the task's agent
        async with AsyncSessionLocal() as db:
            task = await db.get(Task, task_id)
            agent_id = task.agent_id if task else None

        trace_channel = f"agent:{agent_id}:traces" if agent_id else None
        if trace_channel:
            await pubsub.subscribe(trace_channel)

        # 3. Run both listeners concurrently
        terminal_states = {"completed", "failed", "pending_approval"}

        async def listen_pubsub():
            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue
                try:
                    event = json.loads(message["data"])
                    if event.get("task_id") == task_id:
                        await send("trace", event)
                except Exception:
                    pass

        async def poll_db():
            last_status = None
            while True:
                await asyncio.sleep(2)
                async with AsyncSessionLocal() as db:
                    task = await db.get(Task, task_id)
                if not task:
                    break
                if task.status != last_status:
                    last_status = task.status
                    await send("status", {"task_id": task_id, "status": task.status})
                    if task.status == "completed":
                        await send("result", {
                            "task_id": task_id,
                            "result": task.result,
                            "thought_process": task.thought_process,
                        })
                if task.status in terminal_states:
                    break

        # Race: whichever finishes first (poll_db ends on terminal status)
        await asyncio.gather(
            listen_pubsub(),
            poll_db(),
            return_exceptions=True,
        )

    except WebSocketDisconnect:
        logger.info(f"WS disconnected task={task_id}")
    except Exception as exc:
        logger.error(f"WS error task={task_id}: {exc}")
        await send("error", {"message": str(exc)})
    finally:
        await pubsub.unsubscribe()
        await pubsub.close()
        await redis.aclose()
        logger.info(f"WS closed task={task_id}")
