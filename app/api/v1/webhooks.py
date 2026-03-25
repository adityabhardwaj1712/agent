from fastapi import APIRouter, Request, Header, HTTPException, Depends
from typing import Optional
import json
import logging
from ...config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/slack/events")
async def slack_webhook(request: Request):
    """
    Handle incoming Slack events (interactions, messages, etc).
    """
    body = await request.body()
    # Simple Slack challenge response
    if b"challenge" in body:
        data = json.loads(body)
        return {"challenge": data.get("challenge")}
    
    # Logic for handling task approvals would go here
    logger.info(f"Received Slack Event: {body.decode()}")
    return {"status": "event_received"}

@router.post("/stripe")
async def stripe_webhook(
    request: Request, 
    stripe_signature: str = Header(None)
):
    """
    Handle Stripe billing webhooks (subscription updates, payment success).
    """
    payload = await request.body()
    
    # In a real app, we would verify the signature here:
    # event = stripe.Webhook.construct_event(payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET)
    
    logger.info("Received Stripe Webhook")
    return {"status": "success"}

@router.post("/generic/{source}")
async def generic_webhook(source: str, request: Request):
    """
    Catch-all for other external integrations.
    """
    payload = await request.json()
    logger.info(f"Received generic webhook from {source}")
    return {"source": source, "received": True}
