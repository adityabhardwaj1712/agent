from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from ..db.database import get_db
from ..schemas.tool_schema import ToolCreate, ToolUpdate, ToolResponse
from ..services.tool_service import create_tool, get_tool, list_tools, update_tool, delete_tool
from ..core.deps import require_scopes
from ..core.scopes import Scope, CurrentAgent
from ..core.audit import log_audit

router = APIRouter(prefix="/tools", tags=["tools"])

@router.post("/", response_model=ToolResponse)
async def create(
    request: Request,
    data: ToolCreate,
    db: AsyncSession = Depends(get_db),
    current: CurrentAgent = Depends(require_scopes([Scope.RUN_TASKS])) # Admin-level
):
    result = await create_tool(db, data)
    await log_audit(db, request=request, agent_id=current.agent_id, action="tools.create", status_code=200, detail={"name": data.name})
    return result

@router.get("/", response_model=List[ToolResponse])
async def list_all(
    db: AsyncSession = Depends(get_db),
    only_enabled: bool = True
):
    return await list_tools(db, only_enabled)

@router.get("/{name}", response_model=ToolResponse)
async def get(
    name: str,
    db: AsyncSession = Depends(get_db)
):
    tool = await get_tool(db, name)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool

@router.patch("/{name}", response_model=ToolResponse)
async def update(
    request: Request,
    name: str,
    data: ToolUpdate,
    db: AsyncSession = Depends(get_db),
    current: CurrentAgent = Depends(require_scopes([Scope.RUN_TASKS]))
):
    tool = await update_tool(db, name, data)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    await log_audit(db, request=request, agent_id=current.agent_id, action="tools.update", status_code=200, detail={"name": name})
    return tool

@router.delete("/{name}")
async def delete(
    request: Request,
    name: str,
    db: AsyncSession = Depends(get_db),
    current: CurrentAgent = Depends(require_scopes([Scope.RUN_TASKS]))
):
    success = await delete_tool(db, name)
    if not success:
        raise HTTPException(status_code=404, detail="Tool not found")
    await log_audit(db, request=request, agent_id=current.agent_id, action="tools.delete", status_code=200, detail={"name": name})
    return {"status": "deleted"}
