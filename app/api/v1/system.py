from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional
import random
import time
from ...db.database import get_db
from ...api.deps import get_current_user
from ...models.user import User

router = APIRouter()

class SystemSettings(BaseModel):
    cluster_name: str = "AgentCloud-Production"
    region: str = "us-east-1"
    max_concurrent_agents: int = 256
    default_task_timeout: int = 300
    auto_scaling: bool = True
    debug_mode: bool = False
    telemetry_collection: bool = True

class HealthMetric(BaseModel):
    label: str
    value: str
    status: str # nominal, warning, critical

class SystemHealth(BaseModel):
    cpu_usage: int
    memory_usage: int
    temperature: int
    network_io: str
    metrics: List[HealthMetric]

# Store settings in-memory for this session (simulating persistence for now)
_current_settings = SystemSettings()

@router.get("/health", response_model=SystemHealth)
async def get_system_health(current_user: User = Depends(get_current_user)):
    """
    Returns real-time system performance metrics.
    """
    # Realistic simulation for demonstration
    cpu = random.randint(45, 82)
    mem = random.randint(60, 78)
    temp = random.randint(38, 52)
    net_io = f"{random.randint(600, 950)} MB/s"
    
    return {
        "cpu_usage": cpu,
        "memory_usage": mem,
        "temperature": temp,
        "network_io": net_io,
        "metrics": [
            {"label": "CPU Usage", "value": f"{cpu}%", "status": "nominal" if cpu < 80 else "warning"},
            {"label": "Memory", "value": f"{mem}%", "status": "nominal"},
            {"label": "Temperature", "value": f"{temp}°C", "status": "nominal"},
            {"label": "Network I/O", "value": net_io, "status": "nominal"}
        ]
    }

@router.get("/settings", response_model=SystemSettings)
async def get_settings(current_user: User = Depends(get_current_user)):
    return _current_settings

@router.post("/settings", response_model=SystemSettings)
async def update_settings(settings: SystemSettings, current_user: User = Depends(get_current_user)):
    global _current_settings
    _current_settings = settings
    return _current_settings

@router.get("/alerts")
async def get_alerts(current_user: User = Depends(get_current_user)):
    """
    Returns mock alerts matched to the reference design.
    """
    return [
        {"id": 1, "msg": "Worker-7 CPU exceeded 95% threshold", "type": "critical", "time": "2m ago"},
        {"id": 2, "msg": "Memory usage on Core-B approaching limit", "type": "warning", "time": "8m ago"},
        {"id": 3, "msg": "Auto-scaling triggered for Worker Pool 3", "type": "info", "time": "12m ago"},
        {"id": 4, "msg": "Latency spike detected on ingress node", "type": "warning", "time": "18m ago"},
        {"id": 5, "msg": "Scheduled maintenance window in 2 hours", "type": "info", "time": "25m ago"}
    ]
