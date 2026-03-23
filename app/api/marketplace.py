from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from ..db.database import get_db
from ..schemas.marketplace_schema import (
    AgentTemplateResponse, 
    AgentTemplateCreate, 
    TemplatePurchaseResponse,
    TemplatePurchaseCreate
)
from ..services.marketplace_service import marketplace_service
from ..core.deps import get_current_user # Assuming this exists or will be added

router = APIRouter()

@router.get("/templates", response_model=List[AgentTemplateResponse])
async def list_templates(
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = "popular",
    free_only: bool = False,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """
    List agent templates from the marketplace.
    """
    return await marketplace_service.list_templates(
        db, category, search, sort, free_only, skip, limit
    )

@router.get("/featured", response_model=List[AgentTemplateResponse])
async def list_featured(
    limit: int = 5,
    db: AsyncSession = Depends(get_db)
):
    """
    Get featured agent templates.
    """
    return await marketplace_service.list_templates(
        db, sort="popular", limit=limit
    )

@router.post("/templates", response_model=AgentTemplateResponse)
async def create_template(
    schema: AgentTemplateCreate,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Publish a new template (Creator only).
    """
    return await marketplace_service.create_template(db, user.user_id, user.name, schema)

@router.post("/templates/purchase", response_model=TemplatePurchaseResponse)
async def purchase_template(
    schema: TemplatePurchaseCreate,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Purchase or 'Get' a template.
    """
    try:
        return await marketplace_service.purchase_template(
            db, user.user_id, schema.template_id, schema.payment_method_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/templates/{template_id}/deploy")
async def deploy_template(
    template_id: str,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Deploy a purchased template as a live agent.
    """
    try:
        agent = await marketplace_service.deploy_template(db, user.user_id, template_id)
        return {"status": "success", "agent_id": agent.agent_id}
    except (PermissionError, ValueError) as e:
        raise HTTPException(status_code=403, detail=str(e))
