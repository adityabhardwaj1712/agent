import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.audit_log import AuditLog
from ..db.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

class AuditService:
    """
    Service for recording all critical system transitions and agent actions.
    Ensures compliance and accountability.
    """
    
    async def log_action(
        self, 
        user_id: str, 
        action_type: str, 
        detail: Dict[str, Any],
        agent_id: Optional[str] = None,
        task_id: Optional[str] = None,
        goal_id: Optional[str] = None,
        ip_address: Optional[str] = None
    ):
        """Records an action to the audit log."""
        try:
            async with AsyncSessionLocal() as db:
                log_entry = AuditLog(
                    user_id=user_id,
                    agent_id=agent_id,
                    task_id=task_id,
                    goal_id=goal_id,
                    action_type=action_type,
                    action_detail=detail,
                    ip_address=ip_address,
                    timestamp=datetime.now(timezone.utc).replace(tzinfo=None)
                )
                db.add(log_entry)
                await db.commit()
                logger.info(f"Audit log created: {action_type} for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")

audit_service = AuditService()
