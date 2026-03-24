from fastapi import APIRouter

router = APIRouter()

@router.get("/usage")
async def get_usage():
    return {"usage": 0, "limit": 1000}
