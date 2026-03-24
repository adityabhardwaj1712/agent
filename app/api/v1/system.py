from fastapi import APIRouter

router = APIRouter()

@router.get("/status")
async def get_status():
    return {
        "status": "running",
        "version": "1.0.0",
        "components": {
            "database": {"status": "connected", "latency_ms": 10},
            "redis": {"status": "connected", "latency_ms": 5}
        }
    }
