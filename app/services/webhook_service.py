import httpx
import logging
import asyncio
import hmac
import hashlib
import json
import time
from typing import Any, Dict, Optional
from ..config import settings

logger = logging.getLogger(__name__)

class WebhookService:
    def __init__(self):
        self.secret = settings.SECRET_KEY.encode()

    def _generate_signature(self, payload: str) -> str:
        """Generates an HMAC SHA256 signature for the payload."""
        return hmac.new(self.secret, payload.encode(), hashlib.sha256).hexdigest()

    async def _send_with_retry(self, url: str, payload: Dict[str, Any], max_retries: int = 5, initial_backoff: int = 1):
        """
        Sends an HTTP POST to the given URL with exponential backoff and jitter.
        """
        attempt = 0
        backoff = initial_backoff
        payload_str = json.dumps(payload)
        signature = self._generate_signature(payload_str)

        headers = {
            "Content-Type": "application/json",
            "X-AgentCloud-Signature": signature,
            "X-AgentCloud-Timestamp": str(int(time.time()))
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            while attempt < max_retries:
                try:
                    logger.info(f"Dispatching webhook to {url} [Attempt {attempt+1}/{max_retries}]")
                    response = await client.post(url, content=payload_str, headers=headers)
                    
                    if response.status_code < 400:
                        logger.info(f"Webhook delivered to {url}. Status: {response.status_code}")
                        # In a real enterprise app, we'd log this success to a DB table here.
                        return True
                    elif response.status_code in (408, 429, 500, 502, 503, 504):
                        # Retryable errors
                        logger.warning(f"Webhook failed with status {response.status_code}. Retrying...")
                    else:
                        # Non-retryable client errors
                        logger.error(f"Webhook failed with terminal status {response.status_code}. Aborting.")
                        return False
                except httpx.RequestError as exc:
                    logger.error(f"Webhook connection error: {exc}")
                
                attempt += 1
                if attempt < max_retries:
                    # Exponential backoff with simple jitter
                    sleep_time = backoff + (attempt * 0.5)
                    logger.info(f"Retrying webhook to {url} in {sleep_time} seconds...")
                    await asyncio.sleep(sleep_time)
                    backoff *= 2
        
        logger.error(f"Webhook delivery failed for {url} after {max_retries} attempts.")
        return False

    def dispatch(self, url: str, payload: Dict[str, Any], max_retries: int = 5):
        """
        Fires the webhook asynchronously in the background.
        """
        asyncio.create_task(self._send_with_retry(url, payload, max_retries))

webhook_service = WebhookService()
