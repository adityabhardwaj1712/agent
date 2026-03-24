import asyncio
import json
import os
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.future import select
from sqlalchemy import func
from ..db.database import async_session_factory
from ..models.task import Task
from ..models.agent import Agent
from ..core.logging_config import setup_logging
from ..config import settings
from openai import AsyncOpenAI

logger = setup_logging()

class ReportingService:
    def __init__(self):
        self._report_dir = "app/storage/reports"
        self._ai_client: Optional[AsyncOpenAI] = None
        if settings.OPENAI_API_KEY:
            self._ai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate_daily_report(self) -> str:
        """
        Aggregates system metrics and uses AI to summarize performance.
        """
        os.makedirs(self._report_dir, exist_ok=True)
        timestamp = datetime.now()
        yesterday = timestamp - timedelta(days=1)

        async with async_session_factory() as db:
            # 1. Gather Metrics
            total_tasks = await db.scalar(select(func.count(Task.task_id)).filter(Task.created_at >= yesterday))
            failed_tasks = await db.scalar(select(func.count(Task.task_id)).filter(Task.status == "failed", Task.created_at >= yesterday))
            completed_tasks = await db.scalar(select(func.count(Task.task_id)).filter(Task.status == "completed", Task.created_at >= yesterday))
            
            avg_time = await db.scalar(select(func.avg(Task.execution_time_ms)).filter(Task.status == "completed", Task.created_at >= yesterday)) or 0
            
            # 2. Top Agents
            stmt = select(Agent.name, func.count(Task.task_id).label("count")).join(Task).filter(Task.created_at >= yesterday).group_by(Agent.name).order_by(func.count(Task.task_id).desc()).limit(3)
            result = await db.execute(stmt)
            top_agents = result.all()

        metrics = {
            "period": f"{yesterday.date()} to {timestamp.date()}",
            "total_tasks": total_tasks,
            "failed_tasks": failed_tasks,
            "completed_tasks": completed_tasks,
            "success_rate": f"{(completed_tasks/total_tasks*100):.1f}%" if total_tasks > 0 else "0%",
            "avg_latency_ms": int(avg_time),
            "top_agents": [f"{a.name} ({a.count} tasks)" for a in top_agents]
        }

        # 3. AI Summary
        summary = "No AI summary available."
        if self._ai_client:
            try:
                prompt = f"Summarize the following system performance metrics into a concise 3-sentence business report for an executive dashboard:\n{json.dumps(metrics, indent=2)}"
                response = await self._ai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=200
                )
                summary = response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"Failed to generate AI report summary: {e}")

        report = {
            "timestamp": timestamp.isoformat(),
            "metrics": metrics,
            "ai_summary": summary
        }

        filename = f"report_{timestamp.strftime('%Y%m%d_%H%M%S')}.json"
        filepath = os.path.join(self._report_dir, filename)
        
        with open(filepath, "w") as f:
            json.dump(report, f, indent=2)
            
        logger.info(f"Daily fleet report generated: {filepath}")
        return filepath

reporting_service = ReportingService()
