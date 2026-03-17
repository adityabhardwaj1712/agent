from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
import json
import asyncio
from ..db.redis_client import get_redis_client

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, agent_id: str):
        await websocket.accept()
        if agent_id not in self.active_connections:
            self.active_connections[agent_id] = []
        self.active_connections[agent_id].append(websocket)

    def disconnect(self, websocket: WebSocket, agent_id: str):
        if agent_id in self.active_connections:
            self.active_connections[agent_id].remove(websocket)
            if not self.active_connections[agent_id]:
                del self.active_connections[agent_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_agent(self, agent_id: str, message: dict):
        if agent_id in self.active_connections:
            for connection in self.active_connections[agent_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/{agent_id}")
async def websocket_endpoint(websocket: WebSocket, agent_id: str):
    await manager.connect(websocket, agent_id)
    
    # Subscribe to Redis pub/sub for this agent
    r = get_redis_client()
    pubsub = r.pubsub()
    await pubsub.subscribe(f"agent:{agent_id}", "agent:broadcast")
    
    async def redis_listener():
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = message["data"]
                    if isinstance(data, bytes):
                        data = data.decode("utf-8")
                    await websocket.send_text(data)
        except Exception as e:
            print(f"Redis listener error for {agent_id}: {e}")
        finally:
            await pubsub.unsubscribe()

    # Run listener in background
    listener_task = asyncio.create_task(redis_listener())
    
    try:
        while True:
            # We don't expect much from clients here yet, just keep alive
            data = await websocket.receive_text()
            # If agent sends something, we could pub/sub it
            # For now, just echo or handle internal protocol
    except WebSocketDisconnect:
        manager.disconnect(websocket, agent_id)
        listener_task.cancel()
