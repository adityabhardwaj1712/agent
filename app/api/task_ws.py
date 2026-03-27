from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger
import asyncio
from .v1.router import router as v1_router
from ..services.event_bus import event_bus

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

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to broadcast WS: {e}")

manager = ConnectionManager()

@router.websocket("/tasks")
async def websocket_endpoint(websocket: WebSocket):
    logger.info("New WebSocket connection request to /ws/tasks")
    await manager.connect(websocket)
    
    # Subscribe to Event Bus for this connection
    async def event_handler(event: dict):
        await manager.broadcast(event)

    # Start the event bus subscription in a background task for this socket
    sub_task = asyncio.create_task(event_bus.subscribe(event_handler))
    
    try:
        while True:
            # Maintain connection and listen for heartbeat
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        sub_task.cancel()
    except Exception as e:
        logger.error(f"WS Error: {e}")
        manager.disconnect(websocket)
        sub_task.cancel()
