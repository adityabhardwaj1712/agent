from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os
from ..config import settings

# Configure connection pool for production readiness
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(os.getenv("DEPLOYMENT_MODE", "local") == "local"),
    pool_size=20,              # Maintain up to 20 connections
    max_overflow=10,           # Allow up to 10 extra connections under load
    pool_pre_ping=True,        # Check connection health before use
    pool_recycle=3600,         # Recycle connections every hour
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
