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

# Setup logging
logger = setup_logging()

# Validate environment
print_environment_summary()
validate_or_exit()

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="AgentCloud", version="1.0.0")

@app.on_event("startup")
async def startup_event():
    from .services.automation_service import automation_service
    from .services.auto_mode_service import auto_mode_service
    from .services.supervisor import supervisor_service
    from .db.database import AsyncSessionLocal
    from .models.agent import Agent
    from .models.user import User
    import uuid
    from sqlalchemy import select
    
    # Auto-seed core multi-agent registry
    try:
        async with AsyncSessionLocal() as session:
            existing = await session.execute(select(Agent.name).limit(1))
            if not existing.scalar_one_or_none():
                user_res = await session.execute(select(User).limit(1))
                user = user_res.scalar_one_or_none()
                if not user:
                    user = User(
                        user_id="system_default",
                        email="system@agentcloud.com",
                        name="System Default",
                        hashed_password="dummy" # Dummy password for system agent, cannot be logged into
                    )
                    session.add(user)
                    await session.commit()
                owner_id = user.user_id
                
                AGENT_ROSTER = [
                    {"name": "Planner Agent", "role": "planner", "desc": "Break goals into steps", "model": "gpt-4o"},
                    {"name": "Executor Agent", "role": "executor", "desc": "Executes standard tasks", "model": "gpt-4o"},
                    {"name": "Validator Agent", "role": "validator", "desc": "Checks output quality", "model": "gpt-4o"},
                    {"name": "Retry Agent", "role": "retry", "desc": "Handles failures and retries", "model": "gpt-4o"},
                    {"name": "Goal Agent", "role": "goal", "desc": "Manages full goal execution", "model": "gpt-4o"},
                    {"name": "Memory Agent", "role": "memory", "desc": "Stores & retrieves past context", "model": "gpt-4o"},
                    {"name": "Learning Agent", "role": "learning", "desc": "Improves performance over time", "model": "gpt-4o"},
                    {"name": "Decision Agent", "role": "decision", "desc": "Chooses best strategy/model", "model": "gpt-4o"},
                    {"name": "Optimization Agent", "role": "optimizer", "desc": "Optimizes cost & speed", "model": "gpt-4o"},
                    {"name": "Prediction Agent", "role": "predictor", "desc": "Predicts failures or load", "model": "gpt-4o"},
                    {"name": "Deployment Agent", "role": "deployment", "desc": "Deploy apps (Docker/K8s)", "model": "gpt-4o"},
                    {"name": "Monitoring Agent", "role": "monitor", "desc": "Track system health", "model": "gpt-4o"},
                    {"name": "Logging Agent", "role": "logger", "desc": "Collect & analyze logs", "model": "gpt-4o"},
                    {"name": "Incident Agent", "role": "incident", "desc": "Detect & handle failures", "model": "gpt-4o"},
                    {"name": "Scaling Agent", "role": "scaler", "desc": "Auto scale resources", "model": "gpt-4o"},
                    {"name": "Security Agent", "role": "security", "desc": "Detect threats", "model": "gpt-4o"},
                    {"name": "Compliance Agent", "role": "compliance", "desc": "Check policy violations", "model": "gpt-4o"},
                    {"name": "Access Control Agent", "role": "access", "desc": "Manage permissions", "model": "gpt-4o"},
                    {"name": "Audit Agent", "role": "audit", "desc": "Track system activity", "model": "gpt-4o"},
                    {"name": "Analytics Agent", "role": "analytics", "desc": "Generate insights", "model": "gpt-4o"},
                    {"name": "Reporting Agent", "role": "reporting", "desc": "Create reports", "model": "gpt-4o"},
                    {"name": "Cost Analysis Agent", "role": "cost", "desc": "Track usage cost", "model": "gpt-4o"},
                    {"name": "Performance Agent", "role": "performance", "desc": "Analyze performance", "model": "gpt-4o"},
                    {"name": "API Agent", "role": "api", "desc": "Call external APIs", "model": "gpt-4o"},
                    {"name": "Webhook Agent", "role": "webhook", "desc": "Trigger events based on webhooks", "model": "gpt-4o"},
                    {"name": "GitHub Agent", "role": "github", "desc": "Manage repositories and PRs", "model": "gpt-4o"},
                    {"name": "Slack Agent", "role": "slack", "desc": "Send Slack notifications", "model": "gpt-4o"},
                    {"name": "Delegation Agent", "role": "delegation", "desc": "Assign tasks to other agents", "model": "gpt-4o"},
                    {"name": "Collaboration Agent", "role": "collaborator", "desc": "Coordinate multiple agents", "model": "gpt-4o"},
                    {"name": "Supervisor Agent", "role": "supervisor", "desc": "Monitor all system agents", "model": "gpt-4o"},
                    {"name": "Copilot Agent", "role": "copilot", "desc": "Chat-based intelligent assistant", "model": "gpt-4o"},
                    {"name": "Root Cause Agent", "role": "rca", "desc": "Explain deep system failures", "model": "gpt-4o"},
                    {"name": "Prompt Engineer Agent", "role": "prompt", "desc": "Improve prompts automatically", "model": "gpt-4o"},
                    {"name": "RAG Agent", "role": "rag", "desc": "Search and query knowledge base", "model": "gpt-4o"},
                    {"name": "Experiment Agent", "role": "experimenter", "desc": "Compare models and prompts", "model": "gpt-4o"},
                    {"name": "Scheduler Agent", "role": "scheduler", "desc": "Run tasks on cron", "model": "gpt-4o"},
                    {"name": "Event Agent", "role": "event", "desc": "Trigger executions from system events", "model": "gpt-4o"},
                    {"name": "Workflow Agent", "role": "workflow", "desc": "Execute structured workflow definitions", "model": "gpt-4o"},
                    {"name": "Self-Healing Agent", "role": "healer", "desc": "Auto fix system states", "model": "gpt-4o"},
                    {"name": "Autonomous Agent", "role": "autonomous", "desc": "Run system completely isolated without input", "model": "gpt-4o"},
                    {"name": "Strategy Agent", "role": "strategy", "desc": "Plan long-term execution", "model": "gpt-4o"},
                    {"name": "Resource Manager Agent", "role": "resource", "desc": "Optimize infra usage", "model": "gpt-4o"},
                ]
                
                for data in AGENT_ROSTER:
                    session.add(Agent(
                        agent_id=str(uuid.uuid4()),
                        name=data['name'],
                        role=data['role'],
                        description=data['desc'],
                        owner_id=owner_id,
                        model_name=data['model']
                    ))
                await session.commit()
                logger.info("Automatically seeded 42 core agents into the registry.")
    except Exception as e:
        logger.error(f"Failed to seed default agents: {e}")

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
    allow_headers=["*"],
)

app.add_middleware(MetricsMiddleware)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    import time
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    if process_time > 1.0:
        logger.warning(f"High latency detected: {request.url.path} took {process_time:.2f}s")
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
