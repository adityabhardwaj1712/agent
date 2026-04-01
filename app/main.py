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

# Setup logging
logger = setup_logging()

# Validate environment
print_environment_summary()
validate_or_exit()

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="AgentCloud Mission Control",
    description="""
    🚀 **AgentCloud Enterprise OS**
    
    Military-grade multi-agent orchestration platform. 
    Built for decentralized swarm intelligence and mission-critical autonomy.
    
    **Core Directives:**
    * [RBAC] Role-Based Access Control Enforced
    * [AXON] High-Fidelity LLMOps Tracing
    * [SWARM] Decentralized DAG Routing
    """,
    version="6.0.0-enterprise",
    contact={
        "name": "AgentCloud Command",
        "url": "https://agentcloud.tactical",
    },
    license_info={
        "name": "Proprietary Tactical License",
    }
)

@app.on_event("startup")
async def startup_event():
    # 0. Ensure tables exist (Migration logic)
    try:
        from sqlalchemy import text
        async with engine.begin() as conn:
            # Enable vector extension first
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                logger.info("pgvector extension: AVAILABLE")
            except Exception as vec_error:
                logger.warning(f"pgvector extension not available: {vec_error}")
                logger.warning("Memory/RAG features will use keyword search only")
            
            # Import all models via the root __init__ to register them with metadata
            import app.models  # noqa
            await conn.run_sync(Base.metadata.create_all)

            # Explicitly add columns if missing (self-healing migration)
            # must happen AFTER create_all so tables exist
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'ANALYST';"))
            await conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS node_id VARCHAR;"))
            await conn.execute(text("ALTER TABLE goals ADD COLUMN IF NOT EXISTS workflow_state JSONB;"))
            
            # Traces billing columns
            await conn.execute(text("ALTER TABLE traces ADD COLUMN IF NOT EXISTS tokens_prompt INTEGER DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE traces ADD COLUMN IF NOT EXISTS tokens_completion INTEGER DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE traces ADD COLUMN IF NOT EXISTS total_cost FLOAT DEFAULT 0.0;"))
        logger.info("Database Schema Synchronization & Extensions: OK")
    except Exception as e:
        logger.error(f"CRITICAL: Schema Sync Failed: {e}")
        raise  # Fail fast on critical startup errors

    from .services.automation_service import automation_service
    from .services.auto_mode_service import auto_mode_service
    from .services.supervisor import supervisor_service
    from .db.database import AsyncSessionLocal
    from .models.agent import Agent
    from .models.user import User
    import uuid
    from sqlalchemy import select
    
    # Auto-seed core multi-agent registry via standardized service
    try:
        from .services.agent_service import seed_system_agents
        async with AsyncSessionLocal() as session:
            # Check for existing system user or create one
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
            
            # Seed the 42-agent roster
            await seed_system_agents(session, "system_default")
            logger.info("AgentCloud Registry Sync: OK")
    except Exception as e:
        logger.error(f"Registry Sync Failed: {e}")

    await automation_service.start()
    await auto_mode_service.start()
    await supervisor_service.start()
    
    from .workers.agent_worker import run_worker
    import asyncio
    asyncio.create_task(run_worker())
    
    logger.info("AgentCloud Services Initialized Successfully")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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

@app.get("/")
@limiter.limit("100/minute")
async def health(request: Request):
    pgvector_ok = await check_pgvector()
    return {
        "status": "running", 
        "version": "1.0.0",
        "infrastructure": {
            "pgvector": "available" if pgvector_ok else "missing"
        }
    }


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
