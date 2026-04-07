from fastapi import APIRouter

# Identity & Access
from .identity.auth import router as auth_router
from .identity.api_keys import router as api_keys_router
from .identity.admin import router as admin_router

# Agents Core
from .agents.agents import router as agents_router
from .agents.copilot import router as copilot_router
from .agents.tools import router as tools_router
from .agents.memory import router as memory_router
from .agents.chains import router as chains_router

# Observability
from .observability.analytics import router as analytics_router
from .observability.audit import router as audit_router
from .observability.health import router as health_router
from .observability.system import router as system_router
from .observability.traces import router as traces_router

# Commerce
from .commerce.billing import router as billing_router
from .commerce.marketplace import router as marketplace_router

# Execution
from .execution.goals import router as goals_router
from .execution.tasks import router as tasks_router
from .execution.workflows import router as workflows_router
from .execution.approvals import router as approvals_router
from .execution.playground import router as playground_router
from .execution.notebook import router as notebook_router

# Resources
from .resources.files import router as files_router

# Communication
from .communication.notifications import router as notifications_router
from .communication.webhooks import router as webhooks_router
from .communication.websocket import router as websocket_router
from .communication.protocol import router as protocol_router

router = APIRouter()

# Registering Routes
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(api_keys_router, prefix="/api_keys", tags=["identity"])
router.include_router(admin_router, prefix="/admin", tags=["identity"])

router.include_router(agents_router, prefix="/agents", tags=["agents"])
router.include_router(copilot_router, prefix="/copilot", tags=["agents"])
router.include_router(tools_router, prefix="/tools", tags=["agents"])
router.include_router(memory_router, prefix="/memory", tags=["agents"])
router.include_router(chains_router, prefix="/chains", tags=["agents"])

router.include_router(analytics_router, prefix="/analytics", tags=["observability"])
router.include_router(audit_router, prefix="/audit", tags=["observability"])
router.include_router(health_router, prefix="/health", tags=["observability"])
router.include_router(system_router, prefix="/system", tags=["observability"])
router.include_router(traces_router, prefix="/traces", tags=["observability"])

router.include_router(billing_router, prefix="/billing", tags=["commerce"])
router.include_router(marketplace_router, prefix="/marketplace", tags=["commerce"])

router.include_router(goals_router, prefix="/goals", tags=["execution"])
router.include_router(tasks_router, prefix="/tasks", tags=["execution"])
router.include_router(workflows_router, prefix="/workflows", tags=["execution"])
router.include_router(approvals_router, prefix="/approvals", tags=["execution"])
router.include_router(playground_router, prefix="/playground", tags=["execution"])
router.include_router(notebook_router, prefix="/notebook", tags=["execution"])

router.include_router(files_router, prefix="/files", tags=["resources"])

router.include_router(notifications_router, prefix="/notifications", tags=["communication"])
router.include_router(webhooks_router, prefix="/webhooks", tags=["communication"])
router.include_router(websocket_router, prefix="/ws/fleet", tags=["communication"])
router.include_router(protocol_router, prefix="/protocol", tags=["communication"])
