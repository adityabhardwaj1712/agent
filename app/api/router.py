from fastapi import APIRouter
from .v1.router import router as v1_router
from .task_ws import router as ws_router

router = APIRouter()

router.include_router(v1_router, prefix="/v1")
router.include_router(ws_router, prefix="/ws", tags=["ws"])
