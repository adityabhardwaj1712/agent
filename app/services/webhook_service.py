import httpx
import logging
import asyncio
from typing import Any, Dict
from ..config import settings

logger = logging.getLogger(__name__)

class WebhookService:
    def __init__(self):
        # We can configure global timeout headers here
        pass

    async def _send_with_retry(self, url: str, payload: Dict[str, Any], max_retries: int = 3, initial_backoff: int = 2):
        """
        Sends an HTTP POST to the given URL with an exponential backoff retry mechanism.
        """
        attempt = 0
        backoff = initial_backoff

        async with httpx.AsyncClient(timeout=10.0) as client:
            while attempt < max_retries:
                try:
                    logger.info(f"Dispatching webhook to {url} [Attempt {attempt+1}/{max_retries}]")
                    response = await client.post(url, json=payload)
                    
                    if response.status_code < 400:
                        logger.info(f"Webhook delivered successfully to {url}. Status: {response.status_code}")
                        return True
                    elif response.status_code < 500 and response.status_code not in (408, 429):
                        # Client error (4xx) other than timeout/rate-limit shouldn't be retried
                        logger.warning(f"Webhook failed with client error {response.status_code}. Aborting retries.")
                        return False
                    else:
                        logger.warning(f"Webhook failed with server error {response.status_code}.")
                except httpx.RequestError as exc:
                    logger.error(f"Webhook connection error: {exc}")
                
                attempt += 1
                if attempt < max_retries:
                    logger.info(f"Retrying webhook to {url} in {backoff} seconds...")
                    await asyncio.sleep(backoff)
                    backoff *= 2 # Exponential backoff
        
        logger.error(f"Webhook delivery failed for {url} after {max_retries} attempts.")
        return False

    def dispatch(self, url: str, payload: Dict[str, Any], max_retries: int = 3):
        """
        Fires the webhook asynchronously in the background.
        """
        asyncio.create_task(self._send_with_retry(url, payload, max_retries))

webhook_service = WebhookService()
