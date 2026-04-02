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
    # 1) Health (Shallow)
    code, data = request_json("GET", "/")
    if code != 200:
        _fail(f"GET / failed: {code} {data}")
    print("✓ Basic health check passed")

    # 1.5) Health (Ready/Deep)
    code, data = request_json("GET", "/health/ready")
    if code != 200 or data.get("status") != "ready":
        _fail(f"GET /health/ready failed: {code} {data}")
    print("✓ Infrastructure readiness check passed (DB + Redis)")

    # Metrics
    code, _ = request_json("GET", "/metrics")
    if code != 200:
        _fail(f"GET /metrics failed: {code}")
    print("✓ Metrics check passed")

    # 2) Auth Flow
    email = f"smoke_{uuid.uuid4().hex[:8]}@example.com"
    password = "password123"
    
    # Register
    code, usr = request_json(
        "POST",
        "/v1/auth/register",
        json={"email": email, "password": password, "name": "Smoke Test User"}
    )
    if code not in (200, 201):
        _fail(f"POST /v1/auth/register failed: {code} {usr}")
    print("✓ User registration passed")
    
    # Login
    code, login_data = request_json(
        "POST",
        "/v1/auth/login",
        data={"username": email, "password": password}
    )
    if code != 200:
        _fail(f"POST /v1/auth/login failed: {code} {login_data}")
    
    user_token = login_data["access_token"]
    user_id = usr.get("user_id")
    print("✓ Login (JWT) passed")

    # 3) Agent Management
    code, reg = request_json(
        "POST",
        "/v1/agents/",
        token=user_token,
        json={"name": "smoke-agent", "owner_id": user_id, "role": "tester"},
    )
    if code not in (200, 201) or "agent_id" not in reg:
        _fail(f"POST /v1/agents/ failed: {code} {reg}")
    agent_id = reg["agent_id"]
    print(f"✓ Agent creation passed: {agent_id}")

    # 4) Memory Management
    code, mem = request_json(
        "POST",
        "/v1/memory/",
        token=user_token,
        json={"agent_id": agent_id, "content": "smoke test memory content"},
    )
    if code != 200:
        _fail(f"POST /v1/memory/ failed: {code} {mem}")
    print("✓ Memory write passed")

    code, search = request_json(
        "GET",
        f"/v1/memory/search?query=smoke&agent_id={agent_id}",
        token=user_token,
    )
    if code != 200 or not isinstance(search, dict) or "results" not in search:
        _fail(f"GET /v1/memory/search failed: {code} {search}")
    print("✓ Memory search passed")

    # 5) Task Lifecycle
    code, task = request_json(
        "POST",
        "/v1/tasks/",
        token=user_token,
        json={"agent_id": agent_id, "payload": "ping smoke test task"},
    )
    if code != 200 or "task_id" not in task:
        _fail(f"POST /v1/tasks/ failed: {code} {task}")
    
    task_id = task["task_id"]
    print(f"✓ Task enqueued: {task_id}")

    # Poll status
    deadline = time.time() + 30
    last_status = None
    while time.time() < deadline:
        code, data = request_json("GET", f"/v1/tasks/{task_id}", token=user_token)
        if code == 200:
            last_status = data.get("status")
            if last_status in ("completed", "failed"):
                break
        time.sleep(2)
    
    if last_status not in ("completed", "failed", "queued", "running"): # Allow non-terminal if worker is slow but endpoint works
        _fail(f"Task status retrieval failed: {last_status}")
    print(f"✓ Task status polling passed (Status: {last_status})")

    # 6) Protocol Communication
    code, msg = request_json(
        "POST",
        "/v1/protocol/send",
        token=user_token,
        json={
            "from_agent_id": agent_id,
            "to_agent_id": agent_id,
            "type": "smoke_signal",
            "payload": {"msg": "hello from smoke test"},
            "correlation_id": str(uuid.uuid4())
        },
    )
    if code != 200:
        _fail(f"POST /v1/protocol/send failed: {code} {msg}")
    print("✓ Protocol message dispatch passed")

    print("\n" + "="*20)
    print("  SMOKE TEST PASSED")
    print("="*20)


if __name__ == "__main__":
    main()

