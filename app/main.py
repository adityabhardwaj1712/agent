from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

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
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "An internal server error occurred. Please contact support."},
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

app.include_router(api_router, prefix="/v1")

@app.get("/")
@limiter.limit("5/minute")
def health(request: Request):
    return {"status": "running", "version": "1.0.0"}


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
