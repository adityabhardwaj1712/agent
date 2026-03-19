from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from pydantic import BaseModel

from ..db.database import get_db
from ..core.deps import get_current_user
from ..models.user import User
from ..services.api_key_service import api_key_service
from ..services.billing_service import billing_service
from ..services.skill_library_service import skill_library
from ..services.auto_optimizer import auto_optimizer
from ..services.compliance_service import compliance_service

router = APIRouter(prefix="/developer", tags=["developer"])

class APIKeyCreate(BaseModel):
    label: str
    scopes: List[str] = []
    duration_days: int = None

class APIKeyResponse(BaseModel):
    key_id: str
    label: str
    prefix: str
    scopes: List[str]
    created_at: str
    last_used_at: str = None
    expires_at: str = None

class APIKeyCreated(APIKeyResponse):
    plain_secret: str

@router.post("/keys", response_model=APIKeyCreated)
async def create_key(
    schema: APIKeyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    key_obj, plain_secret = await api_key_service.create_api_key(
        db, 
        user_id=current_user.user_id,
        label=schema.label,
        scopes=schema.scopes,
        duration_days=schema.duration_days
    )
    
    return {
        "key_id": key_obj.key_id,
        "label": key_obj.label,
        "prefix": key_obj.prefix,
        "scopes": key_obj.scopes,
        "created_at": key_obj.created_at.isoformat(),
        "last_used_at": key_obj.last_used_at.isoformat() if key_obj.last_used_at else None,
        "expires_at": key_obj.expires_at.isoformat() if key_obj.expires_at else None,
        "plain_secret": plain_secret
    }

@router.get("/keys", response_model=List[APIKeyResponse])
async def list_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    keys = await api_key_service.list_user_keys(db, current_user.user_id)
    return [
        {
            "key_id": k.key_id,
            "label": k.label,
            "prefix": k.prefix,
            "scopes": k.scopes,
            "created_at": k.created_at.isoformat(),
            "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
            "expires_at": k.expires_at.isoformat() if k.expires_at else None
        } for k in keys
    ]

@router.delete("/keys/{key_id}")
async def revoke_key(
    key_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    success = await api_key_service.delete_api_key(db, key_id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Key not found or unauthorized")
    return {"status": "revoked"}

@router.get("/analytics")
async def get_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed usage, cost, and ROI analytics for the current user.
    """
    return await billing_service.get_detailed_analytics(db, current_user.user_id)

@router.get("/skills")
async def list_skills():
    """List available modular skills for agents."""
    return skill_library.get_available_skills()

@router.post("/agents/{agent_id}/optimize")
async def optimize_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user)
):
    """Trigger AI auto-optimization for a specific agent's prompt."""
    # Note: In a real system, we'd fetch actual success history from the DB/EventStore
    history = [{"payload": "example task", "status": "completed"}] 
    new_prompt = await auto_optimizer.optimize_agent(agent_id, history)
    return {"agent_id": agent_id, "optimized_prompt": new_prompt}

@router.get("/compliance/audit")
async def get_audit_logs(
    current_user: User = Depends(get_current_user)
):
    """Retrieve recent compliance and security audit logs."""
    # Placeholder: In a real app, we'd query an AuditLog table
    return [
        {"timestamp": "2024-03-21T10:00:00Z", "agent_id": "agn_123", "issue": "SSN pattern detected", "severity": "HIGH"},
        {"timestamp": "2024-03-21T10:05:00Z", "agent_id": "agn_124", "issue": "Dangerous command 'rm -rf' blocked", "severity": "CRITICAL"}
    ]
