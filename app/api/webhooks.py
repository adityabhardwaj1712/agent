from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from ..db.database import get_db
from ..services.user_service import user_service
from ..services.task_service import send_task
from ..schemas.task_schema import TaskCreate
from ..models.agent import Agent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.post("/email")
async def inbound_email(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Handles inbound email parsing (e.g., from SendGrid Inbound Parse).
    Extracts 'from', 'subject', and 'text' to trigger an autonomous task.
    """
    try:
        # Inbound parse bodies can be complex; we look for standard fields
        data = await request.json()
    except Exception:
        # Fallback for form-data if json fails
        form_data = await request.form()
        data = dict(form_data)

    sender = data.get("from")
    subject = data.get("subject", "Email Task")
    body = data.get("text", data.get("body", ""))

    if not sender:
        logger.warning("Received email webhook without sender info")
        raise HTTPException(status_code=400, detail="Missing sender")

    # 1. Clean sender (extract email if it's "Name <email@example.com>")
    import re
    email_match = re.search(r"[\w\.-]+@[\w\.-]+", sender)
    if email_match:
        sender_email = email_match.group(0)
    else:
        sender_email = sender

    # 2. Look up user
    user = await user_service.get_user_by_email(db, sender_email)
    if not user:
        logger.error(f"Inbound email from unknown user: {sender_email}")
        raise HTTPException(status_code=404, detail="User not found")

    # 3. Select default agent for the user
    agent_query = select(Agent).where(Agent.owner_id == user.user_id).limit(1)
    res = await db.execute(agent_query)
    agent = res.scalars().first()
    
    if not agent:
        logger.warning(f"User {user.user_id} has no agents to handle email.")
        raise HTTPException(status_code=400, detail="No agent configured for this user")

    # 4. Create Task
    task_payload = f"Subject: {subject}\nContent: {body}"
    task_data = TaskCreate(
        payload=task_payload,
        agent_id=agent.agent_id
    )
    
    try:
        task_result = await send_task(db, task_data, user.user_id)
        logger.info(f"Email task created for user {user.user_id}: {task_result['task_id']}")
        return {"status": "success", "task_id": task_result["task_id"]}
    except Exception as e:
        logger.error(f"Failed to create email task: {e}")
        raise HTTPException(status_code=500, detail="Internal task creation failure")
