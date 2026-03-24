from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
import os
from ..config import settings

# Configure connection pool for production readiness
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=20,              # Maintain up to 20 connections
    max_overflow=10,           # Allow up to 10 extra connections under load
    pool_pre_ping=True,        # Check connection health before use
    pool_recycle=3600,         # Recycle connections every hour
)

# Use modern async_sessionmaker for improved async compatibility
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Alias for compatibility with services
async_session_factory = AsyncSessionLocal

async def get_db():
    """FastAPI dependency for database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
