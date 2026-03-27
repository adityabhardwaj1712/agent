import os
import time
import uuid

import httpx


API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000").rstrip("/")


def _fail(msg: str) -> None:
    raise SystemExit(msg)


def request_json(method: str, path: str, token: str | None = None, **kwargs):
    url = f"{API_BASE_URL}{path}"
    with httpx.Client(timeout=10.0) as client:
        headers = kwargs.pop("headers", {}) or {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        r = client.request(method, url, headers=headers, **kwargs)
        try:
            data = r.json()
        except Exception:
            data = {"raw": r.text}
        return r.status_code, data


def main() -> None:
    # 1) Health
    code, data = request_json("GET", "/")
    if code != 200:
        _fail(f"GET / failed: {code} {data}")

    # metrics
    code, _ = request_json("GET", "/metrics")
    if code != 200:
        _fail(f"GET /metrics failed: {code}")

    # 2) Analytics
    code, data = request_json("GET", "/v1/analytics/summary")
    if code != 200 and code != 401:
        # Ignore 401 for smoke check if auth is enabled without token in this test
        _fail(f"GET /v1/analytics/summary failed: {code} {data}")

    # 3) Register agent
    # Register user first so owner_id exists
    email = f"smoke_{uuid.uuid4().hex[:8]}@example.com"
    password = "password123"
    code, usr = request_json(
        "POST",
        "/v1/auth/register",
        json={"email": email, "password": password}
    )
    if code != 200:
        _fail(f"POST /v1/auth/register failed: {code} {usr}")
    
    # Login to get token for agent registration
    code, login_data = request_json(
        "POST",
        "/v1/auth/login",
        data={"username": email, "password": password}
    )
    if code != 200:
        _fail(f"POST /v1/auth/login failed: {code} {login_data}")
    
    user_token = login_data["access_token"]
    owner_id = usr.get("user_id")
    
    code, reg = request_json(
        "POST",
        "/v1/agents/",
        token=user_token,
        json={"name": "smoke-agent", "owner_id": owner_id},
    )
    if code != 200 or "agent_id" not in reg or "token" not in reg:
        _fail(f"POST /v1/agents/register failed: {code} {reg}")
    agent_id = reg["agent_id"]
    token = reg["token"]

    # 4) Write memory
    code, mem = request_json(
        "POST",
        "/v1/memory/write",
        token=token,
        json={"agent_id": agent_id, "content": "hello world memory"},
    )
    if code != 200:
        _fail(f"POST /v1/memory/write failed: {code} {mem}")

    # 5) Search memory
    code, search = request_json(
        "GET",
        f"/v1/memory/search?q=hello&agent_id={agent_id}",
        token=token,
    )
    if code != 200 or not isinstance(search, list):
        _fail(f"GET /v1/memory/search failed: {code} {search}")

    # 6) Run task + status (will pass once we wire Celery correctly)
    code, task = request_json(
        "POST",
        "/v1/tasks/",
        token=user_token,
        json={"agent_id": agent_id, "payload": "do a simple task"},
    )
    if code != 200 or "task_id" not in task:
        _fail(f"POST /v1/tasks/run failed: {code} {task}")

    task_id = task["task_id"]
    # Poll status endpoint (to be implemented)
    deadline = time.time() + 30
    last = None
    while time.time() < deadline:
        code, last = request_json("GET", f"/v1/tasks/{task_id}", token=token)
        if code == 200 and isinstance(last, dict) and last.get("status") in {
            "completed",
            "failed",
        }:
            break
        time.sleep(1.5)

    if not last or last.get("status") not in {"completed", "failed"}:
        _fail(f"Task did not reach terminal state: {last}")

    # 7) Protocol send
    code, msg = request_json(
        "POST",
        "/v1/protocol/send",
        token=token,
        json={
            "from_agent_id": agent_id,
            "to_agent_id": agent_id,
            "type": "smoke",
            "payload": "hello",
            "correlation_id": str(uuid.uuid4()),
        },
    )
    if code != 200 or "message_id" not in msg:
        _fail(f"POST /v1/protocol/send failed: {code} {msg}")

    print("SMOKE_OK")


if __name__ == "__main__":
    main()

