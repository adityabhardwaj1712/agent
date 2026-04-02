import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from loguru import logger
from ..models.memory import Memory
from ..utils.embeddings import embed_async
from ..schemas.memory_schema import MemoryCreate

async def write_memory(db: AsyncSession, data: MemoryCreate, user_id: str):
    try:
        memory_id = str(uuid.uuid4())
        vector = await embed_async(data.content)
        
        db_memory = Memory(
            memory_id=memory_id,
            agent_id=data.agent_id,
            user_id=user_id,
            content=data.content,
            embedding=vector,
        )
        db.add(db_memory)
        await db.commit()
        await db.refresh(db_memory)
        return {"status": "stored", "memory_id": memory_id}
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to write memory: {e}")
        raise e

async def search_memory(db: AsyncSession, agent_id: str, query: str, limit: int = 5):
    try:
        is_degraded = False
        qvec = None
        
        # 1. Attempt Embedding
        try:
            qvec = await embed_async(query)
        except Exception as e:
            logger.warning(f"Embedding failed, falling back to pure keyword search: {e}")
            is_degraded = True
            
        # 2. Build Query
        stmt = select(Memory).filter(Memory.agent_id == agent_id)
        
        if qvec and not is_degraded:
            try:
                # Order by vector distance (pgvector)
                stmt = stmt.order_by(Memory.embedding.l2_distance(qvec))
            except Exception as e:
                logger.warning(f"pgvector search failed, falling back to keyword: {e}")
                # Fallback to content containment
                stmt = stmt.filter(Memory.content.ilike(f"%{query}%"))
                is_degraded = True
        else:
            # Direct keyword fallback if embedding or vector logic failed
            stmt = stmt.filter(Memory.content.ilike(f"%{query}%"))
            is_degraded = True
        
        result = await db.execute(stmt.limit(limit))
        memories = result.scalars().all()
        
        if not memories and query and not is_degraded:
            # Secondary fallback if vector search returned nothing
            logger.info(f"No semantic results for '{query}', trying keyword fallback")
            stmt_fallback = select(Memory).filter(
                Memory.agent_id == agent_id,
                Memory.content.ilike(f"%{query}%")
            )
            result_fallback = await db.execute(stmt_fallback.limit(limit))
            return {"results": result_fallback.scalars().all(), "search_mode": "fallback", "degraded": True}
            
        return {"results": memories, "search_mode": "vector" if not is_degraded else "keyword", "degraded": is_degraded}
    except Exception as e:
        logger.error(f"Memory search error: {e}")
        return {"results": [], "search_mode": "error", "degraded": True}
