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
        
        with open(file_path, "wb") as f:
            f.write(await file.read())
            
        # In a real production system, we'd trigger a background task here.
        # For this implementation, we'll do a basic chunking and embedding.
        
        content = ""
        if file_ext == ".txt":
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        elif file_ext == ".pdf":
            # Basic PDF extraction logic (placeholder or use pypdf if available)
            content = f"PDF Content of {file.filename} (Placeholder for extraction)"
        else:
            content = f"Data from {file.filename}"

        # Store in memory using the memory service
        from ...schemas.memory_schema import MemoryCreate
        await memory_service.write_memory(
            db, 
            MemoryCreate(agent_id="system", content=f"Document: {file.filename}\n\n{content}"),
            user_id=current_user.user_id
        )
        
        return {"status": "ingested", "file_id": file_id, "filename": file.filename}
        
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
    # Placeholder for file metadata retrieval
    return {"files": []}
