from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from ...db.database import get_db
from ...services.marketplace_service import marketplace_service
from ...api.deps import get_current_user
from ...models.user import User

router = APIRouter()

@router.post("/purchase/{template_id}")
async def purchase_template(
    template_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Acquires a template for the user's fleet. Free templates are instantly authorized.
    """
    try:
        purchase = await marketplace_service.purchase_template(db, current_user.user_id, template_id)
        return {"status": "success", "purchase_id": purchase.purchase_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/deploy/{template_id}")
async def deploy_template(
    template_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Instantiates a purchased agent template into the user's active squadron.
    """
    try:
        agent = await marketplace_service.deploy_template(db, current_user.user_id, template_id)
        return {"status": "deployed", "agent_id": agent.agent_id, "name": agent.name}
    except PermissionError as e:
        raise HTTPException(status_code=402, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

