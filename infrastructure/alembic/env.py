import sys
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool, text
import sqlalchemy as sa

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings
from app.db.base import Base
# Import models so they are registered on Base.metadata.
from app.models import Agent, Task, Goal, ApprovalRequest, AuditLog, Event, Trace, Tool, Memory, ProtocolMessage  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    # Convert asyncpg to sync psycop2 for migrations
    url = os.getenv("DATABASE_URL", settings.DATABASE_URL)
    return url.replace("postgresql+asyncpg://", "postgresql://")


def run_migrations_offline() -> None:
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    url = get_url()
    print(f"SYNC-MIGRATION: Connecting to {url}")
    
    # Use NullPool for migrations to avoid connection issues
    connectable = create_engine(url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        print("SYNC-MIGRATION: Connected. Setting up extension...")
        connection.execute(sa.text("CREATE EXTENSION IF NOT EXISTS vector"))
        connection.commit()
        
        print("SYNC-MIGRATION: Configuring context...")
        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            compare_type=True
        )

        print("SYNC-MIGRATION: Starting transaction and running migrations...")
        with context.begin_transaction():
            context.run_migrations()
        print("SYNC-MIGRATION: Migrations completed successfully")

    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
