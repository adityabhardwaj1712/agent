from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
import asyncio
import json
from loguru import logger
from ...db.redis_client import get_async_redis_client

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

@router.websocket("/fleet")
async def fleet_ws(websocket: WebSocket):
    """
    WebSocket endpoint for real-time fleet telemetry.
    Subscribes to Redis channels and pushes to the client.
    """
    await manager.connect(websocket)
    redis = await get_async_redis_client()
    pubsub = redis.pubsub()
    
    # Subscribe to task updates, agent statuses, and logs
    await pubsub.subscribe("task_updates", "agent_status", "system_logs")
    
    try:
        # Task to listen to Redis and push to WS
        async def listen_redis():
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = message["data"]
                    await websocket.send_text(data)

        # Task to keep connection alive and handle client pings
        async def handle_client():
            while True:
                data = await websocket.receive_text()
                # Simple ping/pong or client-side command handling
                if data == "ping":
                    await websocket.send_text("pong")

        await asyncio.gather(listen_redis(), handle_client())
        
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
    finally:
        await pubsub.unsubscribe()
