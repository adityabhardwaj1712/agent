from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
import os
from ..config import settings

# Configure connection pool for production readiness
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=20,               # Optimized for concurrency vs RAM overhead
    max_overflow=10,           # Allow burst capacity during high-load missions
    pool_pre_ping=True,        # Tactical heartbeat check before checkout
    pool_recycle=1800,         # Recycle every 30m for connection freshness
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
