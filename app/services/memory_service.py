import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from ..models.memory import Memory
from ..utils.embeddings import embed
from ..schemas.memory_schema import MemoryCreate

async def write_memory(db: AsyncSession, data: MemoryCreate):
    memory_id = str(uuid.uuid4())
    vector = embed(data.content)
    
    db_memory = Memory(
        memory_id=memory_id,
        agent_id=data.agent_id,
        content=data.content,
        embedding=vector,
    )
    db.add(db_memory)
    await db.commit()
    await db.refresh(db_memory)
    
    return {"status": "stored", "memory_id": memory_id}

async def search_memory(db: AsyncSession, agent_id: str, query: str):
    qvec = embed(query)
    # Using execute(select(...)) for async compatibility
    stmt = select(Memory).filter(Memory.agent_id == agent_id)
    try:
        # Order by vector distance (pgvector)
        stmt = stmt.order_by(Memory.embedding.l2_distance(qvec))
    except Exception:
        # Fallback to content containment
        stmt = stmt.filter(Memory.content.contains(query))
    
    result = await db.execute(stmt.limit(5))
    return result.scalars().all()
