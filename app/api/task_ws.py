from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from loguru import logger
import asyncio
import json

from ..core.auth_service import verify_token

router = APIRouter()

# Live Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

manager = ConnectionManager()

@router.websocket("/tasks")
async def websocket_endpoint(websocket: WebSocket, user_id: str = Query(None), token: str = Query(None)):
    logger.info(f"New WebSocket connection request to /ws/tasks for user_id={user_id}")
    
    if not token or not verify_token(token):
        await websocket.close(code=4001) # Unauthorized
        return
        
    await manager.connect(websocket)
    
    redis = None
    pubsub = None
    listen_task = None
    
    if user_id:
        from ..db.redis_client import get_async_redis_client
        redis = await get_async_redis_client()
        pubsub = redis.pubsub()
        await pubsub.subscribe(f"task_updates:{user_id}")
        
        async def listen_redis():
            try:
                async for message in pubsub.listen():
                    if message["type"] == "message":
                        await websocket.send_text(
                            message["data"].decode() if isinstance(message["data"], bytes) else message["data"]
                        )
            except asyncio.CancelledError:
                pass
            except Exception as e:
                logger.error(f"Redis listen error: {e}")
                
        listen_task = asyncio.create_task(listen_redis())

    try:
        while True:
            # Maintain connection and listen for heartbeat
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            elif data.startswith("subscribe:task:"):
                # Handle dynamic task stream subscription
                task_id = data.split(":")[-1]
                if pubsub:
                    # Subscribe to all relevant task channels
                    await pubsub.subscribe(f"task_stream:{task_id}")
                    await pubsub.subscribe(f"task_steps:{task_id}")
                    await pubsub.subscribe(f"task_status:{task_id}")
                    logger.info(f"WS Dynamic Subscribed: task_id={task_id}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WS Error: {e}")
        manager.disconnect(websocket)
    finally:
        if listen_task: 
            listen_task.cancel()
        if pubsub: 
            try:
                await pubsub.close()
            except Exception:
                pass
