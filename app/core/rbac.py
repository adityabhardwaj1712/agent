from functools import wraps
from fastapi import HTTPException, Depends, status
from typing import List, Callable
from ..models.user import User
from ..api.deps import get_current_user
from loguru import logger

class Role:
    ADMIN = "ADMIN"
    ORCHESTRATOR = "ORCHESTRATOR"
    ANALYST = "ANALYST"
    VIEWER = "VIEWER"

def requires_role(allowed_roles: List[str]):
    """
    FastAPI dependency factory for Role-Based Access Control.
    Usage: @router.get("/", dependencies=[Depends(requires_role([Role.ADMIN]))])
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # This is a bit tricky for a pure decorator in FastAPI endpoints
            # Better to use it as a Dependency in the router
            pass
        return wrapper
    
    # Correct FastAPI Dependency Pattern
    async def role_checker(current_user: User = Depends(get_current_user)):
        user_role = getattr(current_user, "role", "ANALYST")
        if user_role not in allowed_roles:
            logger.warning(f"RBAC Denied: User {current_user.email} (Role: {user_role}) attempted restricted action.")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation restricted. Required roles: {allowed_roles}. Your role: {user_role}"
            )
        return current_user
        
    return role_checker

# Helper for common role groups
def admin_only():
    return requires_role([Role.ADMIN])

def orchestrator_plus():
    return requires_role([Role.ADMIN, Role.ORCHESTRATOR])
