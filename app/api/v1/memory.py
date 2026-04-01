from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from ...db.database import get_db
from ...services import memory_service
from ...schemas.memory_schema import MemoryCreate, MemoryResponse
from ...api.deps import get_current_user
from ...models.user import User

router = APIRouter()

@router.post("/", response_model=dict)
async def create_memory(
    data: MemoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Store a new memory fragment for an agent.
    """
    return await memory_service.write_memory(db, data, current_user.user_id)

@router.get("/search", response_model=dict)
async def search_memories(
    agent_id: str,
    query: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search for semantically similar memories using pgvector.
    """
    # Note: In a real production system, we'd verify agent ownership here.
    search_data = await memory_service.search_memory(db, agent_id, query)
    # Serialize SQLAlchemy objects because dict response_model bypasses ORM mode mapping
    search_data["results"] = [MemoryResponse.model_validate(m).model_dump() for m in search_data["results"]]
    return search_data

@router.post("/upload")
async def upload_document(
    agent_id: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Extracts text from uploaded PDF/CSV/text and chunks it into vector memory.
    """
    import io
    
    text = ""
    contents = await file.read()
    if file.filename and file.filename.lower().endswith(".pdf"):
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(contents)) as pdf:
                text = "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])
        except ImportError:
            raise HTTPException(status_code=500, detail="pdfplumber dependency missing.")
    else:
        try:
            text = contents.decode("utf-8")
        except Exception:
            raise HTTPException(status_code=400, detail="Could not read file as UTF-8 text.")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No extractable text found.")

    # Chunk text
    chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]
    
    saved = 0
    for chunk in chunks:
        doc = MemoryCreate(
            agent_id=agent_id,
            content=chunk
        )
        await memory_service.write_memory(db, doc, current_user.user_id)
        saved += 1
        
    return {"status": "success", "filename": file.filename, "chunks_saved": saved}
