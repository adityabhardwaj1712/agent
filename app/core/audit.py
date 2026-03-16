import json
import uuid
from sqlalchemy.orm import Session
from fastapi import Request

from ..models.audit_log import AuditLog


def log_audit(
    db: Session,
    *,
    request: Request,
    agent_id: str | None,
    action: str,
    status_code: int | None = None,
    detail: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            log_id=str(uuid.uuid4()),
            agent_id=agent_id,
            action=action,
            method=request.method,
            path=str(request.url.path),
            status_code=str(status_code) if status_code is not None else None,
            detail=json.dumps(detail) if detail is not None else None,
        )
    )
    db.commit()

