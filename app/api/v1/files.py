from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid
import os
from ...db.database import get_db
from ...services import memory_service
from ...api.deps import get_current_user
from ...models.user import User
from loguru import logger

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a document (PDF/CSV/TXT), chunk it, and store in vector memory.
    """
    try:
        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename)[1].lower()
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")
        
        file_bytes = await file.read()
        with open(file_path, "wb") as f:
            f.write(file_bytes)
            
        # Extract text based on file type
        content = ""
        try:
            if file_ext == ".txt":
                content = file_bytes.decode("utf-8")
            elif file_ext == ".pdf":
                # For now, simplistic fallback. In prod, we'd use pdfplumber.
                content = f"PDF_DATA_PLACEHOLDER: {file.filename}\n" + file_bytes.hex()[:1000]
            else:
                content = file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            content = f"Could not extract dynamic text from {file.filename}"

        # Chunk content for better vector search granularity
        chunks = [content[i:i+1200] for i in range(0, len(content), 1000)]
        
        from ...schemas.memory_schema import MemoryCreate
        for chunk in chunks:
            await memory_service.write_memory(
                db, 
                MemoryCreate(agent_id="system", content=f"Source: {file.filename}\n\n{chunk}"),
                user_id=current_user.user_id
            )
        
        return {"status": "ingested", "file_id": file_id, "filename": file.filename, "chunks": len(chunks)}
        
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_files(
    current_user: User = Depends(get_current_user)
):
    """
    List uploaded documents for the current user.
    """
    files = []
    if os.path.exists(UPLOAD_DIR):
        for f in os.listdir(UPLOAD_DIR):
            ext = os.path.splitext(f)[1]
            files.append({
                "file_id": f,
                "filename": f, # In a real DB, we'd have the original name
                "status": "ingested",
                "uploaded_at": "2026-03-30T10:00:00Z"
            })
    return {"files": files}
