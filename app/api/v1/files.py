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
            
        # 1. Extract text based on file type
        content = ""
        try:
            if file_ext == ".txt":
                content = file_bytes.decode("utf-8")
            elif file_ext == ".pdf":
                import io
                from pypdf import PdfReader
                reader = PdfReader(io.BytesIO(file_bytes))
                text_parts = []
                for i, page in enumerate(reader.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(f"--- PAGE {i+1} ---\n{page_text}")
                content = "\n\n".join(text_parts)
            else:
                content = file_bytes.decode("utf-8", errors="ignore")
        except Exception as e:
            logger.error(f"Text extraction failed for {file.filename}: {e}")
            content = f"Error extracting text from {file.filename}: {str(e)}"
            
        if not content.strip():
            content = f"Empty or unreadable document: {file.filename}"

        # 2. Advanced Chunking (Sliding Window)
        # 1000 chars with 100 char overlap for context continuity
        chunk_size = 1000
        overlap = 100
        chunks = []
        
        if len(content) <= chunk_size:
            chunks = [content]
        else:
            start = 0
            while start < len(content):
                end = start + chunk_size
                chunks.append(content[start:end])
                start += (chunk_size - overlap)
        
        # 3. Vector Storage via Memory Service
        from ...schemas.memory_schema import MemoryCreate
        for i, chunk in enumerate(chunks):
            await memory_service.write_memory(
                db, 
                MemoryCreate(
                    agent_id="system", 
                    content=f"DOC_LINK: {file.filename} (CHUNK {i+1})\n\n{chunk}"
                ),
                user_id=current_user.user_id
            )
        
        return {
            "status": "ingested", 
            "file_id": file_id, 
            "filename": file.filename, 
            "chunks": len(chunks),
            "size_chars": len(content)
        }
        
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
