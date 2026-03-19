import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from typing import Optional, List
from ..config import settings

logger = logging.getLogger(__name__)

class EmailService:
    """
    Handles outbound email notifications for task results and summaries.
    """
    def __init__(self):
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.user = settings.SMTP_USER
        self.password = settings.SMTP_PASSWORD
        self.from_email = settings.EMAIL_FROM

    async def send_email(self, to_email: str, subject: str, body: str, html_body: Optional[str] = None):
        """Sends an email via SMTP."""
        if not self.user or not self.password:
            logger.warning("SMTP credentials not configured. Skipping email.")
            return

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = self.from_email
        msg["To"] = to_email

        msg.attach(MIMEText(body, "plain"))
        if html_body:
            msg.attach(MIMEText(html_body, "html"))

        try:
            # Note: In a high-volume scenario, use a background task or an async SMTP client
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls()
                server.login(self.user, self.password)
                server.sendmail(self.from_email, to_email, msg.as_string())
            logger.info(f"Email sent to {to_email}")
        except Exception as e:
            logger.error(f"Failed to send email: {e}")

    async def send_task_complete(self, to_email: str, task_id: str, result: str):
        subject = f"AgentCloud: Task {task_id} Completed"
        body = f"Your task with ID {task_id} has been completed.\n\nRESULT:\n{result}"
        await self.send_email(to_email, subject, body)

email_service = EmailService()
