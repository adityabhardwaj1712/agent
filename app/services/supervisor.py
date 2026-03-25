from typing import Dict, Any, List
from .event_bus import event_bus
from loguru import logger
import asyncio

class StrategyEngine:
    """
    Decides the best execution strategy (models, retries, cost limits)
    based on the current goal and system state.
    """
    def __init__(self):
        self.strategies = {
            "fast": {
                "primary_model": "llama3-8b-8192",
                "fallback_model": "llama3-70b-8192",
                "max_retries": 1,
                "timeout": 30
            },
            "quality": {
                "primary_model": "llama3-70b-8192",
                "fallback_model": "mixtral-8x7b-32768",
                "max_retries": 3,
                "timeout": 120
            },
            "cheap": {
                "primary_model": "llama3-8b-8192",
                "fallback_model": "llama3-8b-8192", # No expensive fallback
                "max_retries": 1,
                "timeout": 20
            }
        }

    def get_config(self, mode: str = "quality") -> Dict[str, Any]:
        return self.strategies.get(mode, self.strategies["quality"])

class SupervisorService:
    """
    The Meta-Agent that monitors the system and optimizes workflows.
    """
    def __init__(self):
        self.stats = {
            "failures": 0,
            "successes": 0,
            "avg_latency": 0.0,
            "total_nodes": 0
        }
        self.strategy_engine = StrategyEngine()
        self._monitor_task = None

    async def start(self):
        """Start monitoring the event bus."""
        logger.info("Supervisor Service starting...")
        self._monitor_task = asyncio.create_task(event_bus.subscribe(self._on_event))

    async def _on_event(self, event: Dict[str, Any]):
        etype = event.get("type")
        if etype == "node_completed":
            self.stats["successes"] += 1
            self.stats["total_nodes"] += 1
        elif etype == "node_failed":
            self.stats["failures"] += 1
            self.stats["total_nodes"] += 1
            logger.warning(f"Supervisor detected failure: {event['data'].get('error')}")
            
            # Auto-remediation logic could go here
            if self.stats["failures"] > 5:
                logger.error("Supervisor: Multiple failures detected. Suggesting strategy shift to 'Quality'.")

    def get_recommendation(self, goal_description: str) -> str:
        """
        Suggests a strategy mode for a new goal.
        """
        desc = goal_description.lower()
        if any(w in desc for w in ["quick", "fast", "simple"]):
            return "fast"
        if any(w in desc for w in ["deep", "thorough", "complex", "research"]):
            return "quality"
        return "quality"

supervisor_service = SupervisorService()
strategy_engine = StrategyEngine()
