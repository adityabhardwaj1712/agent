import uuid
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..models.memory import Memory
from ..utils.embeddings import embed
from ..schemas.memory_schema import MemoryCreate

def write_memory(db: Session, data: MemoryCreate):
    memory_id = str(uuid.uuid4())
    vector = embed(data.content)
    
    db_memory = Memory(
        memory_id=memory_id,
        agent_id=data.agent_id,
        content=data.content,
        embedding=vector,
    )
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    
    return {"status": "stored", "memory_id": memory_id}

def search_memory(db: Session, agent_id: str, query: str):
    q = db.query(Memory).filter(Memory.agent_id == agent_id)
    try:
        qvec = embed(query)
        # Order by vector distance (pgvector)
        q = q.order_by(Memory.embedding.l2_distance(qvec))
        return q.limit(5).all()
    except Exception:
        return q.filter(Memory.content.contains(query)).limit(5).all()
