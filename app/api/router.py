from fastapi import APIRouter
from .agents import router as agents_router
from .memory import router as memory_router
from .tasks import router as tasks_router
from .analytics import router as analytics_router
from .protocol import router as protocol_router
from .approvals import router as approvals_router
from .audit import router as audit_router

router = APIRouter(prefix="/v1")

router.include_router(agents_router, tags=["agents"])
router.include_router(memory_router, tags=["memory"])
router.include_router(tasks_router, tags=["tasks"])
router.include_router(analytics_router, tags=["analytics"])
router.include_router(protocol_router, tags=["protocol"])
router.include_router(approvals_router, tags=["approvals"])
router.include_router(audit_router, tags=["audit"])
