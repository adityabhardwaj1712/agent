from fastapi import APIRouter
from .agents import router as agents_router
from .auth import router as auth_router
from .memory import router as memory_router
from .tasks import router as tasks_router
from .analytics import router as analytics_router
from .protocol import router as protocol_router
from .approvals import router as approvals_router
from .audit import router as audit_router
from .tools import router as tools_router
from .traces import router as traces_router
from .goals import router as goals_router
from .task_ws import router as ws_router
from .deployment import router as deployment_router
from .marketplace import router as marketplace_router
from .billing import router as billing_router
from .developer import router as developer_router
from .webhooks import router as webhooks_router
from .workflows import router as workflows_router
from .admin import router as admin_router
from .query import router as query_router
from .system import router as system_router

router = APIRouter()

router.include_router(system_router, prefix="/system", tags=["system"])
router.include_router(agents_router, tags=["agents"])
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(memory_router, tags=["memory"])
router.include_router(tasks_router, tags=["tasks"])
router.include_router(analytics_router, tags=["analytics"])
router.include_router(protocol_router, tags=["protocol"])
router.include_router(approvals_router, tags=["approvals"])
router.include_router(audit_router, tags=["audit"])
router.include_router(tools_router, tags=["tools"])
router.include_router(traces_router, tags=["traces"])
router.include_router(goals_router, tags=["goals"])
router.include_router(ws_router, tags=["websocket"])
router.include_router(deployment_router, tags=["infrastructure"])
router.include_router(marketplace_router, prefix="/marketplace", tags=["marketplace"])
router.include_router(billing_router, prefix="/billing", tags=["billing"])
router.include_router(developer_router, tags=["developer"])
router.include_router(webhooks_router, tags=["webhooks"])
router.include_router(workflows_router, tags=["workflows"])
router.include_router(admin_router, tags=["admin"])
router.include_router(query_router, tags=["query"])
