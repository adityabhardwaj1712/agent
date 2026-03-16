import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from .metrics import REQUESTS_TOTAL, REQUEST_LATENCY_SECONDS


class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method
        start = time.time()
        status = "500"
        try:
            response: Response = await call_next(request)
            status = str(response.status_code)
            return response
        finally:
            elapsed = time.time() - start
            REQUEST_LATENCY_SECONDS.labels(method=method, path=path).observe(elapsed)
            REQUESTS_TOTAL.labels(method=method, path=path, status=status).inc()

