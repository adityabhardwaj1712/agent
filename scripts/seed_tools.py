import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from app.config import settings
import app.db.base
from app.models.tool import Tool

async def seed():
    engine = create_async_engine("postgresql+asyncpg://postgres:postgres@localhost:5432/agentcloud", echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    tools_to_seed = [
        Tool(
            name="google_search",
            description="Searches Google for real-time information.",
            parameters_schema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to look up on Google."
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="github_create_issue",
            description="Creates an issue in a specific GitHub repository.",
            parameters_schema={
                "type": "object",
                "properties": {
                    "repo": {
                        "type": "string",
                        "description": "The repository name (e.g., owner/repo_name)."
                    },
                    "title": {
                        "type": "string",
                        "description": "The title of the issue."
                    },
                    "body": {
                        "type": "string",
                        "description": "The detailed body of the issue."
                    }
                },
                "required": ["repo", "title", "body"]
            }
        ),
        Tool(
            name="python_interpreter",
            description="Executes python code safely in an isolated sandbox. Ideal for math, logic, and data analysis.",
            parameters_schema={
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "The Python code to execute."
                    }
                },
                "required": ["code"]
            }
        )
    ]
    
    async with async_session() as db:
        for tool in tools_to_seed:
            exists = await db.execute(select(Tool).where(Tool.name == tool.name))
            if not exists.scalars().first():
                db.add(tool)
        await db.commit()
    print("Tools seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed())
