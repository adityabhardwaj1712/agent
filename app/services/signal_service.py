import asyncio
import json
import logging
from typing import Dict, List, Set, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class SignalService:
    """
    Manages real-time signal routing between agents using persistent WebSocket connections.
    """
    def __init__(self):
        # Maps user_id -> set of active WebSockets
        self.user_connections: Dict[str, Set[WebSocket]] = {}
        # Maps agent_id -> set of active WebSockets (if agents are connected directly)
        self.agent_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        """Add a new connection for a user."""
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)
        logger.info(f"Signal channel opened for user {user_id}")

    def disconnect(self, user_id: str, websocket: WebSocket):
        """Remove a connection."""
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        logger.info(f"Signal channel closed for user {user_id}")

    async def emit_signal(self, user_id: str, signal_type: str, payload: Any):
        """
        Broadcasts a signal to all active connections for a specific user.
        """
        if user_id not in self.user_connections:
            return

        message = json.dumps({
            "type": "SIGNAL",
            "signal_type": signal_type,
            "payload": payload,
            "timestamp": asyncio.get_event_loop().time()
        })

        dead_connections = set()
        for ws in self.user_connections[user_id]:
            try:
                await ws.send_text(message)
            except Exception as e:
                logger.warning(f"Failed to emit signal to connection: {e}")
                dead_connections.add(ws)

        # Cleanup dead connections
        for dead in dead_connections:
            self.user_connections[user_id].discard(dead)

signal_service = SignalService()
