from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Response
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from .api.router import router as api_router
from .config import settings
from .core.middleware import MetricsMiddleware

app = FastAPI(title="AgentCloud", version="1.0.0")

origins = [o.strip() for o in (settings.CORS_ORIGINS or "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(MetricsMiddleware)

app.include_router(api_router)

@app.get("/")
def health():
    return {"status": "running", "version": "1.0.0"}


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
