import aiohttp
import logging
from typing import Optional, Dict, Any, List
from ..config import settings

logger = logging.getLogger(__name__)

class ExternalIntegrationService:
    """
    Handles bi-directional syncing with project management tools (GitHub, Jira).
    """
    def __init__(self):
        self.github_token = settings.GITHUB_ACCESS_TOKEN
        self.jira_url = settings.JIRA_API_URL
        self.jira_key = settings.JIRA_API_KEY
        self.jira_user = settings.JIRA_USER_EMAIL

    async def create_github_issue(self, repo: str, title: str, body: str) -> Optional[Dict[str, Any]]:
        """Creates an issue in a GitHub repository."""
        if not self.github_token:
            logger.warning("GitHub token not configured.")
            return None

        url = f"https://api.github.com/repos/{repo}/issues"
        headers = {
            "Authorization": f"token {self.github_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        payload = {"title": title, "body": body}

        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload) as resp:
                if resp.status == 201:
                    return await resp.json()
                logger.error(f"GitHub Issue creation failed: {await resp.text()}")
                return None

    async def create_jira_issue(self, project_key: str, summary: str, description: str, issue_type: str = "Task") -> Optional[Dict[str, Any]]:
        """Creates an issue in Jira."""
        if not all([self.jira_url, self.jira_key, self.jira_user]):
            logger.warning("Jira credentials not fully configured.")
            return None

        url = f"{self.jira_url}/rest/api/3/issue"
        auth = aiohttp.BasicAuth(self.jira_user, self.jira_key)
        payload = {
            "fields": {
                "project": {"key": project_key},
                "summary": summary,
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [{"type": "paragraph", "content": [{"type": "text", "text": description}]}]
                },
                "issuetype": {"name": issue_type}
            }
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, auth=auth, json=payload) as resp:
                if resp.status == 201:
                    return await resp.json()
                logger.error(f"Jira Issue creation failed: {await resp.text()}")
                return None

external_integration_service = ExternalIntegrationService()
