from fastapi import APIRouter
from .agents import router as agents_router
from .tasks import router as tasks_router
from .analytics import router as analytics_router
from .auth import router as auth_router
from .system import router as system_router
from .billing import router as billing_router
from .traces import router as traces_router
from .marketplace import router as marketplace_router
from .workflows import router as workflows_router
from .goals import router as goals_router
from .approvals import router as approvals_router
from .tools import router as tools_router
from .audit import router as audit_router
from .admin import router as admin_router
from .protocol import router as protocol_router
from .websocket import router as websocket_router
from .memory import router as memory_router
from .chains import router as chains_router
from .copilot import router as copilot_router
from .files import router as files_router

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(agents_router, prefix="/agents", tags=["agents"])
router.include_router(tasks_router, prefix="/tasks", tags=["tasks"])
router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
router.include_router(system_router, prefix="/system", tags=["system"])
router.include_router(billing_router, prefix="/billing", tags=["billing"])
router.include_router(traces_router, prefix="/traces", tags=["traces"])
router.include_router(marketplace_router, prefix="/marketplace", tags=["marketplace"])
router.include_router(workflows_router, prefix="/workflows", tags=["workflows"])
router.include_router(goals_router, prefix="/goals", tags=["goals"])
router.include_router(approvals_router, prefix="/approvals", tags=["approvals"])
router.include_router(tools_router, prefix="/tools", tags=["tools"])
router.include_router(audit_router, prefix="/audit", tags=["audit"])
router.include_router(admin_router, prefix="/admin", tags=["admin"])
router.include_router(protocol_router, prefix="/protocol", tags=["protocol"])
router.include_router(websocket_router, prefix="/ws/fleet", tags=["realtime"])
router.include_router(memory_router, prefix="/memory", tags=["memory"])
router.include_router(chains_router, prefix="/chains", tags=["chains"])
router.include_router(copilot_router, prefix="/copilot", tags=["copilot"])
router.include_router(files_router, prefix="/files", tags=["files"])
