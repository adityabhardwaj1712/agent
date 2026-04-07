from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.notebook import Notebook, NotebookEntry
from typing import List
import uuid

router = APIRouter()

@router.get("/", response_model=List[dict])
def get_notebooks(db: Session = Depends(deps.get_db), current_user = Depends(deps.get_current_user)):
    notebooks = db.query(Notebook).filter(Notebook.user_id == current_user.user_id).all()
    return [{"id": n.notebook_id, "title": n.title, "updated_at": n.updated_at} for n in notebooks]

@router.post("/")
def create_notebook(title: str, db: Session = Depends(deps.get_db), current_user = Depends(deps.get_current_user)):
    notebook = Notebook(title=title, user_id=current_user.user_id)
    db.add(notebook)
    db.commit()
    db.refresh(notebook)
    return notebook

@router.get("/{notebook_id}")
def get_notebook(notebook_id: str, db: Session = Depends(deps.get_db), current_user = Depends(deps.get_current_user)):
    notebook = db.query(Notebook).filter(Notebook.notebook_id == notebook_id, Notebook.user_id == current_user.user_id).first()
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")
    
    entries = db.query(NotebookEntry).filter(NotebookEntry.notebook_id == notebook_id).order_by(NotebookEntry.timestamp.asc()).all()
    return {
        "id": notebook.notebook_id,
        "title": notebook.title,
        "content": notebook.content,
        "entries": entries
    }

@router.post("/{notebook_id}/entries")
def add_entry(notebook_id: str, content: str, entry_type: str = "user_edit", db: Session = Depends(deps.get_db), current_user = Depends(deps.get_current_user)):
    notebook = db.query(Notebook).filter(Notebook.notebook_id == notebook_id, Notebook.user_id == current_user.user_id).first()
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")
    
    entry = NotebookEntry(notebook_id=notebook_id, content_delta=content, entry_type=entry_type)
    db.add(entry)
    
    # Update master content (simple append for now)
    notebook.content += f"\n{content}"
    db.commit()
    return entry
