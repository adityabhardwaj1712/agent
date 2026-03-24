import asyncio
import os
from sqlalchemy.future import select
from app.db.database import AsyncSessionLocal
from app.models.task import Task

async def check_tasks():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Task).order_by(Task.created_at.desc()))
        tasks = result.scalars().all()
        print(f"Total Tasks: {len(tasks)}")
        for t in tasks:
            print(f"ID: {t.task_id} | Status: {t.status} | Created: {t.created_at}")

if __name__ == "__main__":
    asyncio.run(check_tasks())
