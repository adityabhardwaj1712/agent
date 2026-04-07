import uuid
import time
from sqlalchemy import text, select, inspect
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
from .database import engine, Base, AsyncSessionLocal
from ..models.user import User
from ..models.agent import Agent
from ..services.agent_service import seed_system_agents

def get_columns_sync(conn, table_name):
    """
    Synchronously inspect table columns.
    
    Args:
        conn: The SQLAlchemy connection.
        table_name: Name of the table to inspect.
        
    Returns:
        List[str]: List of column names.
    """
    inspector = inspect(conn)
    return [c['name'] for c in inspector.get_columns(table_name)]

class SyncManager:
    """
    Manages database schema hardening, automatic migrations, and initial data seeding.
    Handles the 'Self-Healing' capabilities of the AgentCloud backend.
    """

    @staticmethod
    async def run_initial_migrations():
        """
        Runs initial table creation and extension setup.
        Ensures pgvector is available and protocol tables are instantiated.
        """
        async with engine.begin() as conn:
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                logger.info("[MIGRATION] pgvector extension: READY")
            except Exception as e:
                logger.warning(f"[MIGRATION] pgvector setup skipped: {e}")

            # Define protocol storage if missing
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS protocol_messages (
                    message_id VARCHAR PRIMARY KEY,
                    from_agent_id VARCHAR NOT NULL,
                    to_agent_id VARCHAR NOT NULL,
                    message_type VARCHAR NOT NULL,
                    payload TEXT NOT NULL,
                    correlation_id VARCHAR,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    org_id VARCHAR DEFAULT 'default' NOT NULL
                );
            """))
            
            import app.models  # Ensure all models are registered with Base
            await conn.run_sync(Base.metadata.create_all)
            logger.info("[MIGRATION] Core tables synchronization: COMPLETE")

    @staticmethod
    async def harden_schema():
        """
        Inspects existing tables and injects missing tactical columns (org_id, metrics, etc.).
        Ensures the data layer matches the latest professional enterprise specs.
        """
        tables = [
            "users", "agents", "tasks", "goals", "traces", "approval_requests", 
            "audit_logs", "events", "tools", "memories", "notifications",
            "dlq_events", "circuit_breaker_logs", "agent_templates", 
            "template_purchases", "template_reviews", "subscriptions", "usage_records",
            "system_logs", "protocol_messages"
        ]
        
        async with engine.connect() as conn:
            for table in tables:
                try:
                    async with engine.begin() as conn_begin:
                        existing_cols = await conn_begin.run_sync(get_columns_sync, table)
                        if "org_id" not in existing_cols:
                            await conn_begin.execute(text(f'ALTER TABLE "{table}" ADD COLUMN "org_id" VARCHAR DEFAULT \'default\' NOT NULL;'))
                            await conn_begin.execute(text(f'CREATE INDEX IF NOT EXISTS "ix_{table}_org_id" ON "{table}" ("org_id");'))
                            logger.info(f"[HARDENING] Injected 'org_id' into table: {table}")
                except Exception as e:
                    logger.debug(f"[HARDENING] Skipping 'org_id' for {table}: {e}")

            # Specific Tactical Column Injections
            schema_map = {
                "approval_requests": {
                    "user_id": "VARCHAR NOT NULL",
                    "goal_id": "VARCHAR",
                    "processed_at": "TIMESTAMP WITHOUT TIME ZONE",
                    "processed_by": "VARCHAR"
                },
                "users": {
                    "role": "VARCHAR DEFAULT 'ADMIN'", 
                    "stripe_customer_id": "VARCHAR"
                },
                "agents": {
                    "reputation_score": "DOUBLE PRECISION DEFAULT 50.0", 
                    "total_tasks": "INTEGER DEFAULT 0", 
                    "successful_tasks": "INTEGER DEFAULT 0",
                    "model_name": "VARCHAR DEFAULT 'gpt-4o'"
                }
            }
            
            for table, cols in schema_map.items():
                for col, spec in cols.items():
                    try:
                        async with engine.begin() as conn_begin:
                            existing = await conn_begin.run_sync(get_columns_sync, table)
                            if col not in existing:
                                await conn_begin.execute(text(f'ALTER TABLE "{table}" ADD COLUMN "{col}" {spec};'))
                                logger.info(f"[HARDENING] Injected '{col}' into table: {table}")
                    except Exception as e:
                        logger.warning(f"[HARDENING] Failed to inject {table}.{col}: {e}")

    @staticmethod
    async def seed_data():
        """
        Provisions default system users and seeds the primary agent registry.
        """
        try:
            async with AsyncSessionLocal() as session:
                user_res = await session.execute(select(User).filter(User.user_id == "system_default"))
                user = user_res.scalar_one_or_none()
                if not user:
                    user = User(
                        user_id="system_default",
                        email="system@agentcloud.com",
                        name="System Default",
                        role="ADMIN",
                        hashed_password="dummy_system_hash"
                    )
                    session.add(user)
                    await session.commit()
                
                await seed_system_agents(session, "system_default")
                logger.info("[SEED] AgentCloud Registry Provisioning: SUCCESS")
        except Exception as e:
            logger.error(f"[SEED] Registry Provisioning Failed: {e}")
