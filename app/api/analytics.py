from fastapi import APIRouter

router = APIRouter(prefix="/analytics")

@router.get("/metrics")
def get_metrics():
    return {
        "active_agents": 12,
        "tasks_last_24h": 1452,
        "success_rate": "99.8%",
        "auto_healing_events": 24,
        "avg_reasoning_time": "450ms"
    }
