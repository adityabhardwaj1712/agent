from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models.tool import Tool
from ..schemas.tool_schema import ToolCreate, ToolUpdate
from typing import List, Optional

async def create_tool(db: AsyncSession, data: ToolCreate) -> Tool:
    db_tool = Tool(
        name=data.name,
        description=data.description,
        parameters_schema=data.parameters_schema,
        implementation_code=data.implementation_code,
        is_enabled=data.is_enabled
    )
    db.add(db_tool)
    await db.commit()
    await db.refresh(db_tool)
    return db_tool

async def get_tool(db: AsyncSession, name: str) -> Optional[Tool]:
    result = await db.execute(select(Tool).filter(Tool.name == name))
    return result.scalars().first()

async def list_tools(db: AsyncSession, only_enabled: bool = True) -> List[Tool]:
    query = select(Tool)
    if only_enabled:
        query = query.filter(Tool.is_enabled == True)
    result = await db.execute(query)
    return result.scalars().all()

async def update_tool(db: AsyncSession, name: str, data: ToolUpdate) -> Optional[Tool]:
    db_tool = await get_tool(db, name)
    if not db_tool:
        return None
    
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_tool, key, value)
    
    await db.commit()
    await db.refresh(db_tool)
    return db_tool

async def delete_tool(db: AsyncSession, name: str) -> bool:
    db_tool = await get_tool(db, name)
    if not db_tool:
        return False
    await db.delete(db_tool)
    await db.commit()
    return True
async def load_dynamic_tools(db: AsyncSession):
    """
    AXON Plugin System: Loads implementation_code from DB into the ToolExecutor registry.
    """
    from .tool_executor import ToolExecutor
    from loguru import logger
    
    tools = await list_tools(db, only_enabled=True)
    for t in tools:
        if t.implementation_code:
            try:
                # Create a local scope for the dynamic function
                local_scope = {}
                exec(t.implementation_code, globals(), local_scope)
                
                # Finding the function in the local scope
                func_name = t.name
                if func_name in local_scope:
                    ToolExecutor._registry[func_name] = local_scope[func_name]
                    logger.info(f"Loaded dynamic tool: {func_name}")
                else:
                    # Fallback: look for any function if name doesn't match
                    funcs = [v for k, v in local_scope.items() if callable(v)]
                    if funcs:
                        ToolExecutor._registry[func_name] = funcs[0]
                        logger.info(f"Loaded dynamic tool: {func_name} (implementation function name varied)")
            except Exception as e:
                logger.error(f"Failed to load dynamic tool {t.name}: {e}")
