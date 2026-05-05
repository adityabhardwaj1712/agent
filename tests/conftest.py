import pytest
from typing import AsyncGenerator
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.db.database import get_db
from app.main import app
from app.api.deps import get_current_user
from app.models.user import User
import asyncio
import os

# Create a test specific database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_agentcloud.db"

# Create async engine for test database
engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

TestingSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
)

async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session

async def override_get_current_user() -> User:
    return User(user_id="test-user", email="test@example.com", role="admin")

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
def setup_db(event_loop):
    async def init_db():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
            
    async def teardown_db():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            
    event_loop.run_until_complete(init_db())
    yield
    event_loop.run_until_complete(teardown_db())
    if os.path.exists("./test_agentcloud.db"):
        os.remove("./test_agentcloud.db")

@pytest.fixture(scope="module")
def client():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
