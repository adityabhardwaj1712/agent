import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from loguru import logger
from ..models.memory import Memory
from ..utils.embeddings import embed
from ..schemas.memory_schema import MemoryCreate

async def write_memory(db: AsyncSession, data: MemoryCreate, user_id: str):
    try:
        memory_id = str(uuid.uuid4())
        vector = embed(data.content)
        
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
        qvec = embed(query)
        # Using execute(select(...)) for async compatibility
        stmt = select(Memory).filter(Memory.agent_id == agent_id)
        
        try:
            # Order by vector distance (pgvector)
            stmt = stmt.order_by(Memory.embedding.l2_distance(qvec))
        except Exception as e:
            logger.warning(f"pgvector search failed, falling back to keyword: {e}")
            # Fallback to content containment
            stmt = stmt.filter(Memory.content.ilike(f"%{query}%"))
        
        result = await db.execute(stmt.limit(limit))
        return result.scalars().all()
    except Exception as e:
        logger.error(f"Memory search error: {e}")
        return []
