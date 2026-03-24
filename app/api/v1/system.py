from fastapi import APIRouter

router = APIRouter()

@router.get("/status")
async def get_status():
    return {"status": "ok", "version": "1.0.0"}
