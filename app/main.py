from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import sys
import io

# Ensure sys.stdout and sys.stderr are not None to prevent uvicorn/logging crashes
if sys.stdout is None:
    sys.stdout = io.StringIO()
if sys.stderr is None:
    sys.stderr = io.StringIO()

from .api.router import router as api_router
from .config import settings
from .core.middleware import MetricsMiddleware

from .core.logging_config import setup_logging
from .core.env_validator import validate_or_exit, print_environment_summary
from .db.base import Base # All models must be imported BEFORE create_all
from .db.database import engine

from contextlib import asynccontextmanager

# Setup logging
logger = setup_logging()

# Validate environment
print_environment_summary()
validate_or_exit()

def get_columns_sync(conn, table_name):
    from sqlalchemy import inspect
    inspector = inspect(conn)
    return [c['name'] for c in inspector.get_columns(table_name)]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # -- STARTUP --
    # 0. Ensure tables exist (Migration logic)
    try:
        from sqlalchemy import text
        async with engine.begin() as conn:
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                logger.info("pgvector extension: AVAILABLE")
            except Exception as vec_error:
                logger.warning(f"pgvector extension not available: {vec_error}")

            try:
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
            except Exception as e:
                logger.warning(f"Error creating protocol_messages table: {e}")
            
            import app.models  # noqa
            await conn.run_sync(Base.metadata.create_all)
            
        # 1. Granular Self-Healing Migrations (Inspector-Based)
        async with engine.connect() as conn:
            tables = [
                "users", "agents", "tasks", "goals", "traces", "approval_requests", 
                "audit_logs", "events", "tools", "memories", "notifications",
                "dlq_events", "circuit_breaker_logs", "agent_templates", 
                "template_purchases", "template_reviews", "subscriptions", "usage_records",
                "system_logs"
            ]
            for table in tables:
                try:
                    async with engine.begin() as conn_begin:
                        existing_cols = await conn_begin.run_sync(get_columns_sync, table)
                        if "org_id" not in existing_cols:
                            await conn_begin.execute(text(f'ALTER TABLE "{table}" ADD COLUMN "org_id" VARCHAR DEFAULT \'default\' NOT NULL;'))
                            await conn_begin.execute(text(f'CREATE INDEX IF NOT EXISTS "ix_{table}_org_id" ON "{table}" ("org_id");'))
                            logger.info(f"Added org_id to {table}")
                except Exception as e:
                    logger.debug(f"Skipping org_id for {table}: {e}")
            
            user_cols = {
                "role": "VARCHAR DEFAULT 'ADMIN'", 
                "stripe_customer_id": "VARCHAR", 
                "is_active": "BOOLEAN DEFAULT TRUE", 
                "is_superuser": "BOOLEAN DEFAULT FALSE"
            }
            for col, spec in user_cols.items():
                try:
                    async with engine.begin() as conn_begin:
                        existing_user_cols = await conn_begin.run_sync(get_columns_sync, "users")
                        if col not in existing_user_cols:
                            await conn_begin.execute(text(f'ALTER TABLE "users" ADD COLUMN "{col}" {spec};'))
                            logger.info(f"Added column users.{col}")
                except Exception as e:
                    logger.warning(f"Failed to add users.{col}: {e}")

            agent_cols = {
                "reputation_score": "DOUBLE PRECISION DEFAULT 50.0", 
                "total_tasks": "INTEGER DEFAULT 0", 
                "successful_tasks": "INTEGER DEFAULT 0", 
                "failed_tasks": "INTEGER DEFAULT 0", 
                "personality_config": "TEXT", 
                "model_name": "VARCHAR DEFAULT 'gpt-4o'", 
                "base_cost": "DOUBLE PRECISION DEFAULT 0.01", 
                "role": "VARCHAR", 
                "description": "TEXT", 
                "owner_id": "VARCHAR", 
                "status": "VARCHAR DEFAULT 'idle'", 
                "scopes": "TEXT DEFAULT 'READ_MEMORY,WRITE_MEMORY,RUN_TASKS,SEND_PROTOCOL'"
            }
            for col, spec in agent_cols.items():
                try:
                    async with engine.begin() as conn_begin:
                        existing_agent_cols = await conn_begin.run_sync(get_columns_sync, "agents")
                        if col not in existing_agent_cols:
                            await conn_begin.execute(text(f'ALTER TABLE "agents" ADD COLUMN "{col}" {spec};'))
                            logger.info(f"Added column agents.{col}")
                except Exception as e:
                    logger.warning(f"Failed to add agents.{col}: {e}")

            task_cols = {
                "retry_count": "INTEGER DEFAULT 0", 
                "max_retries": "INTEGER DEFAULT 3", 
                "task_hash": "VARCHAR", 
                "priority_level": "INTEGER DEFAULT 5", 
                "is_cached_result": "BOOLEAN DEFAULT FALSE", 
                "execution_time_ms": "INTEGER", 
                "model_used": "VARCHAR", 
                "node_id": "VARCHAR", 
                "thought_process": "TEXT", 
                "input_data": "TEXT", 
                "output_data": "TEXT", 
                "cost": "DOUBLE PRECISION DEFAULT 0.0", 
                "parent_task_id": "VARCHAR",
                "org_id": "VARCHAR DEFAULT 'default' NOT NULL"
            }
            for col, spec in task_cols.items():
                try:
                    async with engine.begin() as conn_begin:
                        existing_task_cols = await conn_begin.run_sync(get_columns_sync, "tasks")
                        if col not in existing_task_cols:
                            await conn_begin.execute(text(f'ALTER TABLE "tasks" ADD COLUMN "{col}" {spec};'))
                            logger.info(f"Added column tasks.{col}")
                except Exception as e:
                    logger.warning(f"Failed to add tasks.{col}: {e}")

            goal_cols = {
                "workflow_type": "VARCHAR DEFAULT 'linear'", 
                "workflow_json": "TEXT", 
                "workflow_state": "JSONB", 
                "target_outcome": "TEXT"
            }
            for col, spec in goal_cols.items():
                try:
                    async with engine.begin() as conn_begin:
                        existing_goal_cols = await conn_begin.run_sync(get_columns_sync, "goals")
                        if col not in existing_goal_cols:
                            await conn_begin.execute(text(f'ALTER TABLE "goals" ADD COLUMN "{col}" {spec};'))
                            logger.info(f"Added column goals.{col}")
                except Exception as e:
                    logger.warning(f"Failed to add goals.{col}: {e}")

            trace_cols = {
                "tokens_prompt": "INTEGER DEFAULT 0", 
                "tokens_completion": "INTEGER DEFAULT 0", 
                "total_cost": "DOUBLE PRECISION DEFAULT 0.0"
            }
            for col, spec in trace_cols.items():
                try:
                    async with engine.begin() as conn_begin:
                        existing_trace_cols = await conn_begin.run_sync(get_columns_sync, "traces")
                        if col not in existing_trace_cols:
                            await conn_begin.execute(text(f'ALTER TABLE "traces" ADD COLUMN "{col}" {spec};'))
                            logger.info(f"Added column traces.{col}")
                except Exception as e:
                    logger.warning(f"Failed to add traces.{col}: {e}")
            
        logger.info("[SHIELD] System Schema Hardening: ENABLED")
    except Exception as e:
        logger.error(f"CRITICAL: Schema Sync Failed: {e}")

    from .services.automation_service import automation_service
    from .services.auto_mode_service import auto_mode_service
    from .services.supervisor import supervisor_service
    from .db.database import AsyncSessionLocal
    from .models.agent import Agent
    from .models.user import User
    import uuid
    from sqlalchemy import select
    
    try:
        from .services.agent_service import seed_system_agents
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
            logger.info("AgentCloud Registry Sync: OK")
    except Exception as e:
        logger.error(f"Registry Sync Failed: {e}")

    await automation_service.start()
    await auto_mode_service.start()
    await supervisor_service.start()
    
    logger.info("AgentCloud Services Initialized Successfully [ARQ DISPATCH MODE]")
    
    yield  # -- APP RUNS HERE --
    
    # -- SHUTDOWN --
    logger.info("AgentCloud shutting down...")

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="AgentCloud Mission Control",
    description="""
    [ROCKET] **AgentCloud Enterprise OS**
    
    Military-grade multi-agent orchestration platform. 
    Built for decentralized swarm intelligence and mission-critical autonomy.
    
    **Core Directives:**
    * [RBAC] Role-Based Access Control Enforced
    * [AXON] High-Fidelity LLMOps Tracing
    * [SWARM] Decentralized DAG Routing
    """,
    version="6.0.0-enterprise",
    lifespan=lifespan,
    contact={
        "name": "AgentCloud Command",
        "url": "https://agentcloud.tactical",
    },
    license_info={
        "name": "Proprietary Tactical License",
    }
)



app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Tactical Validation Breach at {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "message": "Protocol Validation Failed",
            "errors": exc.errors(),
            "path": request.url.path
        },
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    tb = traceback.format_exc()
    logger.error(f"Unhandled exception at {request.url.path}: {exc}\n{tb}")
    return JSONResponse(
        status_code=500,
        content={"message": f"Internal Error: {str(exc)}", "path": request.url.path},
    )

origins = [o.strip() for o in (settings.CORS_ORIGINS or "").split(",") if o.strip()]
if not origins:
    # Safe default for local development, never use ["*"] in production
    origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With", "X-Process-Time"],
)

from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(MetricsMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    import time
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    if process_time > 1.0:
        logger.warning(f"High latency [Tactical Breach]: {request.url.path} took {process_time:.2f}s")
    
    # Industrial Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws: wss:;"
    
    return response

app.include_router(api_router)


async def check_pgvector():
    from .db.database import AsyncSessionLocal
    from sqlalchemy import text
    try:
        async with AsyncSessionLocal() as session:
            res = await session.execute(text("SELECT 1 FROM pg_extension WHERE extname = 'vector'"))
            return res.scalar() is not None
    except Exception:
        return False

@app.get("/health_check")
@limiter.limit("60/minute")
async def readiness_check(request: Request):
    """Deep health check for infrastructure readiness."""
    checks = {
        "database": False,
        "redis": False,
        "pgvector": False,
    }
    
    # 1. Check DB
    try:
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            checks["database"] = True
    except Exception as e:
        logger.error(f"Readiness check failed (DB): {e}")

    # 2. Check Redis
    try:
        from .db.redis_client import get_async_redis_client
        redis = await get_async_redis_client()
        await redis.ping()
        checks["redis"] = True
    except Exception as e:
        logger.error(f"Readiness check failed (Redis): {e}")

    # 3. Check pgvector
    checks["pgvector"] = await check_pgvector()

    is_ready = all([checks["database"], checks["redis"]])
    status_code = 200 if is_ready else 503
    
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ready" if is_ready else "not_ready",
            "infrastructure": checks,
            "version": settings.VERSION if hasattr(settings, 'VERSION') else "6.0.0"
        }
    )

@app.get("/")
@limiter.limit("100/minute")
async def health(request: Request):
    pgvector_ok = await check_pgvector()
    return {
        "status": "online", 
        "version": "6.0.0-enterprise",
        "infrastructure": {
            "pgvector": "available" if pgvector_ok else "missing"
        }
    }


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
