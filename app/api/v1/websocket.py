from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
import asyncio
import json
from loguru import logger
from ...db.redis_client import get_async_redis_client
from ...services.signal_service import signal_service


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

@router.websocket("/protocol/{user_id}")
async def protocol_ws(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time inter-agent protocol signals.
    """
    await signal_service.connect(user_id, websocket)
    
    try:
        while True:
            # Receive and potentially handle client signals (uplink)
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "PING":
                await websocket.send_text(json.dumps({"type": "PONG"}))
            elif message.get("type") == "SIGNAL":
                # Handle client-initiated signals if needed
                pass
                
    except WebSocketDisconnect:
        signal_service.disconnect(user_id, websocket)
    except Exception as e:
        logger.error(f"Protocol WebSocket error for user {user_id}: {e}")
        signal_service.disconnect(user_id, websocket)

@router.websocket("/goal-stream/{goal_id}")
async def goal_stream_ws(websocket: WebSocket, goal_id: str):
    """
    Subscribes specifically to an in-progress goal's live steps and content stream.
    """
    await task_stream_ws(websocket, goal_id)

@router.websocket("/task-stream/{task_id}")
async def task_stream_ws(websocket: WebSocket, task_id: str):
    """
    Subscribes specifically to an in-progress task's live steps and content stream.
    """
    await websocket.accept()
    redis = await get_async_redis_client()
    pubsub = redis.pubsub()
    
    # Subscribe to BOTH reasoning steps and raw content chunks
    await pubsub.subscribe(f"task_steps:{task_id}", f"task_stream:{task_id}")
    
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                # Forward to client
                # If it's a content chunk (task_stream:{task_id}), we wrap it in a recognizable TYPE
                channel = message["channel"]
                data = message["data"]
                
                msg_type = "THOUGHT" if channel == f"task_steps:{task_id}" else "CHUNK"
                await websocket.send_text(json.dumps({
                    "type": msg_type,
                    "payload": json.loads(data) if msg_type == "THOUGHT" else data
                }))
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Task stream error for {task_id}: {e}")
    finally:
        await pubsub.unsubscribe()
