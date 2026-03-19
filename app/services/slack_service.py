import aiohttp
import logging
from typing import Optional, Dict, Any
from ..config import settings

logger = logging.getLogger(__name__)

class SlackService:
    """
    Handles Slack integration for notifications and HITL approvals.
    """
    def __init__(self):
        self.webhook_url = settings.SLACK_WEBHOOK_URL if hasattr(settings, "SLACK_WEBHOOK_URL") else None
        self.bot_token = settings.SLACK_BOT_TOKEN if hasattr(settings, "SLACK_BOT_TOKEN") else None

    async def send_notification(self, message: str, channel: Optional[str] = None):
        """Sends a simple message to Slack."""
        if not self.webhook_url:
            logger.warning("Slack Webhook URL not configured. Skipping notification.")
            return

        payload = {"text": message}
        if channel:
            payload["channel"] = channel

        async with aiohttp.ClientSession() as session:
            async with session.post(self.webhook_url, json=payload) as resp:
                if resp.status != 200:
                    logger.error(f"Failed to send Slack notification: {await resp.text()}")

    async def request_approval(self, task_id: str, description: str, channel: str):
        """Sends an interactive message for HITL approval."""
        if not self.bot_token:
            logger.warning("Slack Bot Token not configured. Skipping approval request.")
            return

        # Simplified Slack Block Kit payload
        blocks = [
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*Approval Required for Task:* {task_id}\n{description}"}
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "Approve"},
                        "style": "primary",
                        "value": f"approve_{task_id}",
                        "action_id": "approve_task"
                    },
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "Reject"},
                        "style": "danger",
                        "value": f"reject_{task_id}",
                        "action_id": "reject_task"
                    }
                ]
            }
        ]

        async with aiohttp.ClientSession() as session:
            headers = {"Authorization": f"Bearer {self.bot_token}"}
            payload = {"channel": channel, "blocks": blocks}
            async with session.post("https://slack.com/api/chat.postMessage", headers=headers, json=payload) as resp:
                data = await resp.json()
                if not data.get("ok"):
                    logger.error(f"Slack API Error: {data.get('error')}")

slack_service = SlackService()
