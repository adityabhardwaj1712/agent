from fastapi import APIRouter
from .agents import router as agents_router
from .tasks import router as tasks_router
from .analytics import router as analytics_router
from .auth import router as auth_router
from .system import router as system_router
from .billing import router as billing_router

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(agents_router, prefix="/agents", tags=["agents"])
router.include_router(tasks_router, prefix="/tasks", tags=["tasks"])
router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
router.include_router(system_router, prefix="/system", tags=["system"])
router.include_router(billing_router, prefix="/billing", tags=["billing"])
