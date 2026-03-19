from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from typing import Optional, List, Dict, Any
from ..config import settings
from loguru import logger

class SlackService:
    """
    Handles communication between AgentCloud and Slack.
    """
    
    def __init__(self, bot_token: Optional[str] = None):
        self.token = bot_token or settings.SECRET_KEY # Placeholder
        self.client = WebClient(token=self.token)

    async def send_message(self, channel: str, text: str, blocks: Optional[List[Dict]] = None) -> bool:
        """
        Sends a message to a Slack channel.
        """
        try:
            response = self.client.chat_postMessage(
                channel=channel,
                text=text,
                blocks=blocks
            )
            return response["ok"]
        except SlackApiError as e:
            logger.error(f"Slack API Error: {e.response['error']}")
            return False

    async def send_approval_request(self, channel: str, task_id: str, action_text: str):
        """
        Sends an interactive approval request to Slack.
        """
        blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Approval Requested*\nTask: {task_id}\nAction: {action_text}"
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "Approve"},
                        "style": "primary",
                        "value": f"approve:{task_id}",
                        "action_id": "approve_task"
                    },
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "Deny"},
                        "style": "danger",
                        "value": f"deny:{task_id}",
                        "action_id": "deny_task"
                    }
                ]
            }
        ]
        return await self.send_message(channel, f"Approval request for task {task_id}", blocks=blocks)

slack_service = SlackService()
