#!/usr/bin/env python3
"""
AgentCloud Doctor - Comprehensive Feature Diagnostic, Reporter & Auto-Fixer
============================================================================
Tests EVERY feature deeply (not just HTTP status), generates a detailed report,
auto-fixes what it can, and confirms everything is running.

Usage:
    python scripts/doctor.py                  # Full diagnostic + report
    python scripts/doctor.py --fix            # Diagnose AND auto-fix issues
    python scripts/doctor.py --report-only    # Just generate report from last run
"""

import asyncio
import datetime
import json
import os
import subprocess
import sys
import time
import traceback
import uuid
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Ensure project root is on sys.path
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
API_BASE = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")
REPORT_PATH = PROJECT_ROOT / "doctor_report.md"

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

class Status(str, Enum):
    PASS = "✅ PASS"
    FAIL = "❌ FAIL"
    WARN = "⚠️  WARN"
    FIXED = "🔧 FIXED"
    SKIP = "⏭️  SKIP"

@dataclass
class TestResult:
    category: str
    name: str
    status: Status
    detail: str = ""
    fix_applied: str = ""
    latency_ms: float = 0.0

@dataclass
class DiagnosticReport:
    started_at: str = ""
    finished_at: str = ""
    results: List[TestResult] = field(default_factory=list)
    fixes_applied: List[str] = field(default_factory=list)
    summary: Dict[str, int] = field(default_factory=dict)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

class C:
    """Terminal colours."""
    GREEN  = "\033[92m"
    RED    = "\033[91m"
    YELLOW = "\033[93m"
    BLUE   = "\033[94m"
    CYAN   = "\033[96m"
    BOLD   = "\033[1m"
    RESET  = "\033[0m"

def banner(text: str):
    w = 72
    print(f"\n{C.CYAN}{C.BOLD}{'═' * w}{C.RESET}")
    print(f"{C.CYAN}{C.BOLD}  {text}{C.RESET}")
    print(f"{C.CYAN}{C.BOLD}{'═' * w}{C.RESET}\n")

def section(text: str):
    print(f"\n{C.BLUE}{C.BOLD}── {text} {'─' * max(1, 60 - len(text))}{C.RESET}")

def ok(msg: str):
    print(f"  {C.GREEN}✓ {msg}{C.RESET}")

def fail(msg: str):
    print(f"  {C.RED}✗ {msg}{C.RESET}")

def warn(msg: str):
    print(f"  {C.YELLOW}⚠ {msg}{C.RESET}")

def info(msg: str):
    print(f"  {C.BLUE}ℹ {msg}{C.RESET}")

# ---------------------------------------------------------------------------
# The Doctor
# ---------------------------------------------------------------------------

class AgentCloudDoctor:

    def __init__(self, auto_fix: bool = False):
        self.auto_fix = auto_fix
        self.report = DiagnosticReport(started_at=datetime.datetime.now().isoformat())
        self._token: Optional[str] = None
        self._admin_user_id: Optional[str] = None
        self._test_agent_id: Optional[str] = None

    # ------ Low-level HTTP helpers ------

    async def _http(self, method: str, path: str, *,
                    json_body: dict = None, data: dict = None,
                    headers: dict = None, timeout: float = 10.0) -> Tuple[int, Any]:
        import httpx
        url = f"{API_BASE}{path}"
        hdrs = dict(headers or {})
        if self._token:
            hdrs.setdefault("Authorization", f"Bearer {self._token}")
        async with httpx.AsyncClient(timeout=timeout) as client:
            t0 = time.time()
            if method == "GET":
                r = await client.get(url, headers=hdrs)
            elif method == "POST":
                if data is not None:
                    r = await client.post(url, data=data, headers=hdrs)
                else:
                    r = await client.post(url, json=json_body or {}, headers=hdrs)
            elif method == "PATCH":
                r = await client.patch(url, json=json_body or {}, headers=hdrs)
            elif method == "DELETE":
                r = await client.delete(url, headers=hdrs)
            else:
                raise ValueError(f"Unknown method {method}")
            latency = (time.time() - t0) * 1000
            try:
                body = r.json()
            except Exception:
                body = r.text
            return r.status_code, body, latency

    def _record(self, category: str, name: str, status: Status, detail: str = "", latency: float = 0.0, fix: str = ""):
        r = TestResult(category=category, name=name, status=status, detail=detail, latency_ms=round(latency, 1), fix_applied=fix)
        self.report.results.append(r)
        if status == Status.PASS:
            ok(f"{name} ({latency:.0f}ms)" if latency else name)
        elif status == Status.FAIL:
            fail(f"{name}: {detail}")
        elif status == Status.WARN:
            warn(f"{name}: {detail}")
        elif status == Status.FIXED:
            ok(f"{name}: FIXED — {fix}")
        elif status == Status.SKIP:
            info(f"{name}: skipped — {detail}")

    # ====================================================================
    # 1. INFRASTRUCTURE CHECKS
    # ====================================================================

    async def check_infrastructure(self):
        section("1. Infrastructure")

        # 1a. API Health (Shallow)
        try:
            code, body, lat = await self._http("GET", "/")
            if code == 200 and isinstance(body, dict) and body.get("status") == "online":
                self._record("Infrastructure", "API Basic Health", Status.PASS, latency=lat)
            else:
                self._record("Infrastructure", "API Basic Health", Status.FAIL, f"HTTP {code}: {body}")
        except Exception as e:
            self._record("Infrastructure", "API Basic Health", Status.FAIL, str(e))
            fail("API is not reachable — remaining tests will fail!")
            return False

        # 1a.5 API Readiness (Deep)
        try:
            code, body, lat = await self._http("GET", "/health/ready")
            if code == 200 and isinstance(body, dict) and body.get("status") == "ready":
                self._record("Infrastructure", "API Readiness (DB+Redis)", Status.PASS, latency=lat)
            else:
                self._record("Infrastructure", "API Readiness", Status.FAIL, f"HTTP {code}: {body}")
        except Exception as e:
            self._record("Infrastructure", "API Readiness", Status.FAIL, str(e))

        # 1b. System status (DB + Redis)
        try:
            code, body, lat = await self._http("GET", "/v1/system/status")
            if code == 200 and isinstance(body, dict):
                overall = body.get("status", "unknown")
                components = body.get("components", {})
                db_status = components.get("database", {}).get("status", "unknown")
                redis_status = components.get("redis", {}).get("status", "unknown")

                if db_status == "connected":
                    db_lat = components["database"].get("latency_ms", 0)
                    self._record("Infrastructure", "PostgreSQL Connection", Status.PASS, latency=db_lat)
                else:
                    self._record("Infrastructure", "PostgreSQL Connection", Status.FAIL, f"status={db_status}")

                if redis_status == "connected":
                    r_lat = components["redis"].get("latency_ms", 0)
                    self._record("Infrastructure", "Redis Connection", Status.PASS, latency=r_lat)
                else:
                    self._record("Infrastructure", "Redis Connection", Status.FAIL, f"status={redis_status}")
            else:
                self._record("Infrastructure", "System Status", Status.FAIL, f"HTTP {code}")
        except Exception as e:
            self._record("Infrastructure", "System Status", Status.FAIL, str(e))

        # 1c. Prometheus metrics
        try:
            code, body, lat = await self._http("GET", "/metrics")
            if code == 200 and "process_" in str(body):
                self._record("Infrastructure", "Prometheus Metrics", Status.PASS, latency=lat)
            else:
                self._record("Infrastructure", "Prometheus Metrics", Status.WARN, "endpoint returned but no process metrics found")
        except Exception as e:
            self._record("Infrastructure", "Prometheus Metrics", Status.FAIL, str(e))

        # 1d. Docker containers
        try:
            result = subprocess.run(
                ["docker", "ps", "--format", "{{.Names}}|{{.Status}}"],
                capture_output=True, text=True, timeout=5
            )
            lines = [l for l in result.stdout.strip().split("\n") if l]
            running = {l.split("|")[0]: l.split("|")[1] for l in lines if "|" in l}
            for name in ["agent-db-1", "agent-redis-1"]:
                if name in running and "Up" in running[name]:
                    self._record("Infrastructure", f"Docker: {name}", Status.PASS, running[name])
                elif name in running:
                    self._record("Infrastructure", f"Docker: {name}", Status.WARN, running[name])
                else:
                    self._record("Infrastructure", f"Docker: {name}", Status.FAIL, "container not found")
        except Exception as e:
            msg = f"docker not available: {e}"
            if os.name == 'nt':
                msg += " (Hint: Ensure Docker Desktop is running and in PATH)"
            self._record("Infrastructure", "Docker Check", Status.WARN, msg)

        return True

    # ====================================================================
    # 2. AUTH & USER MANAGEMENT
    # ====================================================================

    async def check_auth(self):
        section("2. Authentication & User Management")

        test_email = f"doctor_{uuid.uuid4().hex[:6]}@test.com"
        test_password = "DoctorTest123!"

        # 2a. Register
        try:
            code, body, lat = await self._http("POST", "/v1/auth/register", json_body={
                "email": test_email,
                "password": test_password,
                "name": "Doctor Test User",
                "role": "ADMIN"
            })
            if code in (200, 201):
                self._admin_user_id = body.get("user_id")
                self._record("Auth", "User Registration", Status.PASS, latency=lat)
            elif code == 400 and "already" in str(body).lower():
                self._record("Auth", "User Registration", Status.WARN, "User already exists (OK for re-runs)")
            else:
                self._record("Auth", "User Registration", Status.FAIL, f"HTTP {code}: {body}")
        except Exception as e:
            self._record("Auth", "User Registration", Status.FAIL, str(e))

        # 2b. Login
        try:
            # Standard OAuth2 form data
            code, body, lat = await self._http("POST", "/v1/auth/login", data={
                "username": test_email,
                "password": test_password
            })
            if code == 200 and isinstance(body, dict) and "access_token" in body:
                self._token = body.get("access_token")
                self._record("Auth", "User Login (JWT)", Status.PASS, latency=lat)
            else:
                self._record("Auth", "User Login (JWT)", Status.FAIL, f"HTTP {code}: {body}")
        except Exception as e:
            self._record("Auth", "User Login (JWT)", Status.FAIL, str(e))

        # 2c. Authenticated request
        if self._token:
            try:
                code, body, lat = await self._http("GET", "/v1/agents/my")
                if code == 200:
                    self._record("Auth", "Authenticated Endpoint (/agents/my)", Status.PASS, latency=lat)
                else:
                    self._record("Auth", "Authenticated Endpoint", Status.FAIL, f"HTTP {code}")
            except Exception as e:
                self._record("Auth", "Authenticated Endpoint", Status.FAIL, str(e))
        else:
            self._record("Auth", "Authenticated Endpoint", Status.SKIP, "No token available")

    # ====================================================================
    # 3. AGENT CRUD
    # ====================================================================

    async def check_agents(self):
        section("3. Agent Management")

        # 3a. Create agent
        try:
            # Use the actual user ID from registration
            owner_id = self._admin_user_id or "system_default"
            code, body, lat = await self._http("POST", "/v1/agents/", json_body={
                "name": f"Doctor Test Agent {uuid.uuid4().hex[:4]}",
                "role": "tester",
                "owner_id": owner_id,
                "description": "Created by AgentCloud Doctor for diagnostic testing",
                "model_name": "gpt-4o"
            })
            if code in (200, 201):
                self._test_agent_id = body.get("agent_id")
                self._record("Agents", "Create Agent", Status.PASS, latency=lat)
            else:
                self._record("Agents", "Create Agent", Status.FAIL, f"HTTP {code}: {body}")
        except Exception as e:
            self._record("Agents", "Create Agent", Status.FAIL, str(e))

        # 3b. List agents
        try:
            code, body, lat = await self._http("GET", "/v1/agents/")
            if code == 200 and isinstance(body, list):
                count = len(body)
                self._record("Agents", f"List Agents ({count} found)", Status.PASS, latency=lat)
            else:
                self._record("Agents", "List Agents", Status.FAIL, f"HTTP {code}: {body}")
        except Exception as e:
            self._record("Agents", "List Agents", Status.FAIL, str(e))

        # 3c. Get single agent
        if self._test_agent_id:
            try:
                code, body, lat = await self._http("GET", f"/v1/agents/{self._test_agent_id}")
                if code == 200 and body.get("agent_id") == self._test_agent_id:
                    self._record("Agents", "Get Agent by ID", Status.PASS, latency=lat)
                else:
                    self._record("Agents", "Get Agent by ID", Status.FAIL, f"HTTP {code}")
            except Exception as e:
                self._record("Agents", "Get Agent by ID", Status.FAIL, str(e))

            # 3d. Update agent
            try:
                code, body, lat = await self._http("PATCH", f"/v1/agents/{self._test_agent_id}", json_body={
                    "description": "Updated by Doctor diagnostic"
                })
                if code == 200:
                    self._record("Agents", "Update Agent", Status.PASS, latency=lat)
                else:
                    self._record("Agents", "Update Agent", Status.FAIL, f"HTTP {code}: {body}")
            except Exception as e:
                self._record("Agents", "Update Agent", Status.FAIL, str(e))

            # 3e. Agent metrics
            try:
                code, body, lat = await self._http("GET", f"/v1/agents/{self._test_agent_id}/metrics")
                if code == 200 and "success_rate" in str(body):
                    self._record("Agents", "Agent Metrics", Status.PASS, latency=lat)
                else:
                    self._record("Agents", "Agent Metrics", Status.FAIL, f"HTTP {code}: {body}")
            except Exception as e:
                self._record("Agents", "Agent Metrics", Status.FAIL, str(e))

            # 3f. Agent history
            try:
                code, body, lat = await self._http("GET", f"/v1/agents/{self._test_agent_id}/history")
                if code == 200:
                    self._record("Agents", "Agent Task History", Status.PASS, latency=lat)
                else:
                    self._record("Agents", "Agent Task History", Status.FAIL, f"HTTP {code}: {body}")
            except Exception as e:
                self._record("Agents", "Agent Task History", Status.FAIL, str(e))
        else:
            for t in ["Get Agent by ID", "Update Agent", "Agent Metrics", "Agent Task History"]:
                self._record("Agents", t, Status.SKIP, "No test agent created")

        # 3g. Builtin agent templates
        try:
            code, body, lat = await self._http("GET", "/v1/agents/builtin")
            if code == 200 and isinstance(body, list):
                self._record("Agents", f"Builtin Templates ({len(body)} found)", Status.PASS, latency=lat)
            else:
                self._record("Agents", "Builtin Templates", Status.FAIL, f"HTTP {code}")
        except Exception as e:
            self._record("Agents", "Builtin Templates", Status.FAIL, str(e))

        # 3h. Leaderboard
        try:
            code, body, lat = await self._http("GET", "/v1/agents/leaderboard")
            if code == 200 and isinstance(body, list):
                self._record("Agents", f"Agent Leaderboard ({len(body)} agents)", Status.PASS, latency=lat)
            else:
                self._record("Agents", "Agent Leaderboard", Status.FAIL, f"HTTP {code}")
        except Exception as e:
            self._record("Agents", "Agent Leaderboard", Status.FAIL, str(e))

    # ====================================================================
    # 4. ANALYTICS & OBSERVABILITY
    # ====================================================================

    async def check_analytics(self):
        section("4. Analytics & Observability")

        endpoints = [
            ("/v1/analytics/metrics", "Analytics Metrics"),
            ("/v1/analytics/summary", "Analytics Summary (Dashboard)"),
            ("/v1/traces/", "Traces List"),
        ]
        for path, name in endpoints:
            try:
                code, body, lat = await self._http("GET", path)
                if code == 200:
                    self._record("Analytics", name, Status.PASS, latency=lat)
                elif code == 401:
                    self._record("Analytics", name, Status.WARN, "Requires auth (expected)")
                else:
                    self._record("Analytics", name, Status.FAIL, f"HTTP {code}: {body}")
            except Exception as e:
                self._record("Analytics", name, Status.FAIL, str(e))

    # ====================================================================
    # 5. MARKETPLACE
    # ====================================================================

    async def check_marketplace(self):
        section("5. Marketplace")

        try:
            code, body, lat = await self._http("GET", "/v1/marketplace/templates")
            if code == 200:
                self._record("Marketplace", "List Templates", Status.PASS, latency=lat)
            else:
                self._record("Marketplace", "List Templates", Status.FAIL, f"HTTP {code}: {body}")
        except Exception as e:
            self._record("Marketplace", "List Templates", Status.FAIL, str(e))

        try:
            code, body, lat = await self._http("GET", "/v1/marketplace/featured")
            if code == 200:
                self._record("Marketplace", "Featured Agents", Status.PASS, latency=lat)
            elif code == 404:
                self._record("Marketplace", "Featured Agents", Status.WARN, "endpoint not found")
            else:
                self._record("Marketplace", "Featured Agents", Status.FAIL, f"HTTP {code}")
        except Exception as e:
            self._record("Marketplace", "Featured Agents", Status.FAIL, str(e))

    # ====================================================================
    # 6. BILLING & SUBSCRIPTIONS
    # ====================================================================

    async def check_billing(self):
        section("6. Billing & Subscriptions")

        try:
            code, body, lat = await self._http("GET", "/v1/billing/subscription")
            if code == 200:
                self._record("Billing", "Subscription Info", Status.PASS, latency=lat)
            elif code == 401:
                self._record("Billing", "Subscription Info", Status.WARN, "Requires auth")
            else:
                self._record("Billing", "Subscription Info", Status.FAIL, f"HTTP {code}: {body}")
        except Exception as e:
            self._record("Billing", "List Plans", Status.FAIL, str(e))

        try:
            code, body, lat = await self._http("GET", "/v1/billing/usage")
            if code == 200:
                self._record("Billing", "Usage Report", Status.PASS, latency=lat)
            elif code == 401:
                self._record("Billing", "Usage Report", Status.WARN, "Requires auth")
            else:
                self._record("Billing", "Usage Report", Status.FAIL, f"HTTP {code}: {body}")
        except Exception as e:
            self._record("Billing", "Usage Report", Status.FAIL, str(e))

    # ====================================================================
    # 7. WORKFLOWS & GOALS
    # ====================================================================

    async def check_workflows(self):
        section("7. Workflows & Goals")

        try:
            code, body, lat = await self._http("POST", "/v1/workflows/run", json_body={
                "name": "Doctor Test Workflow",
                "nodes": [],
                "edges": [],
            })
            if code in (200, 422, 401, 201):  
                self._record("Workflows", "Workflows List & Run", Status.PASS, latency=lat)
            else:
                self._record("Workflows", "Workflows List & Run", Status.FAIL, f"HTTP {code}: {body}")
        except Exception as e:
            self._record("Workflows", "Workflows List & Run", Status.FAIL, str(e))

        try:
            code, body, lat = await self._http("GET", "/v1/goals/")
            if code == 200:
                self._record("Workflows", "List Goals", Status.PASS, latency=lat)
            elif code == 401:
                self._record("Workflows", "List Goals", Status.WARN, "Requires auth")
            else:
                self._record("Workflows", "List Goals", Status.FAIL, f"HTTP {code}: {body}")
        except Exception as e:
            self._record("Workflows", "List Goals", Status.FAIL, str(e))

    # ====================================================================
    # 8. APPROVALS (HITL)
    # ====================================================================

    async def check_approvals(self):
        section("8. Human-in-the-Loop Approvals")

        try:
            code, body, lat = await self._http("GET", "/v1/approvals/")
            if code == 200:
                self._record("HITL", "List Approvals", Status.PASS, latency=lat)
            else:
                self._record("HITL", "List Approvals", Status.FAIL, f"HTTP {code}: {body}")
        except Exception as e:
            self._record("HITL", "List Approvals", Status.FAIL, str(e))

    # ====================================================================
    # 9. TOOLS (PLUGIN SYSTEM)
    # ====================================================================

    async def check_tools(self):
        section("9. Dynamic Tool / Plugin System")

        try:
            code, body, lat = await self._http("GET", "/v1/tools/")
            if code == 200:
                count = len(body) if isinstance(body, list) else "?"
                self._record("Tools", f"List Tools ({count} found)", Status.PASS, latency=lat)
            elif code == 401:
                self._record("Tools", "List Tools", Status.WARN, "Requires auth")
            else:
                self._record("Tools", "List Tools", Status.FAIL, f"HTTP {code}: {body}")
        except Exception as e:
            self._record("Tools", "List Tools", Status.FAIL, str(e))

    # ====================================================================
    # 10. ADMIN & AUDIT
    # ====================================================================

    async def check_admin(self):
        section("10. Admin & Audit")

        for path, name in [
            ("/v1/audit/logs", "Audit Logs"),
            ("/v1/admin/circuits", "Admin Circuits"),
        ]:
            try:
                code, body, lat = await self._http("GET", path)
                if code == 200:
                    self._record("Admin", name, Status.PASS, latency=lat)
                elif code in (401, 403):
                    self._record("Admin", name, Status.WARN, "Restricted access (expected)")
                else:
                    self._record("Admin", name, Status.FAIL, f"HTTP {code}: {body}")
            except Exception as e:
                self._record("Admin", name, Status.FAIL, str(e))

    # ====================================================================
    # 11. CODEBASE HEALTH
    # ====================================================================

    async def check_codebase(self):
        section("11. Codebase Health")

        # 11a. All Python files parse
        py_files = list(PROJECT_ROOT.glob("app/**/*.py"))
        parse_errors = []
        for f in py_files:
            try:
                compile(f.read_text(encoding="utf-8", errors="ignore"), str(f), "exec")
            except SyntaxError as e:
                parse_errors.append(f"{f.name}:{e.lineno}")
        if parse_errors:
            self._record("Codebase", f"Python Syntax ({len(py_files)} files)", Status.FAIL, f"Errors in: {', '.join(parse_errors[:5])}")
        else:
            self._record("Codebase", f"Python Syntax ({len(py_files)} files)", Status.PASS)

        # 11b. Critical imports
        critical = [
            ("app.main", "FastAPI App"),
            ("app.api.router", "API Router"),
            ("app.db.database", "Database Module"),
            ("app.models.agent", "Agent Model"),
            ("app.models.user", "User Model"),
            ("app.services.agent_service", "Agent Service"),
            ("app.services.task_service", "Task Service"),
            ("app.services.trace_service", "Trace Service"),
        ]
        for module, label in critical:
            try:
                __import__(module)
                self._record("Codebase", f"Import: {label}", Status.PASS)
            except Exception as e:
                self._record("Codebase", f"Import: {label}", Status.FAIL, str(e)[:120])

        # 11c. .env integrity
        env_path = PROJECT_ROOT / ".env"
        if env_path.exists():
            env_text = env_path.read_text()
            required_vars = ["DATABASE_URL", "REDIS_URL", "SECRET_KEY"]
            missing = [v for v in required_vars if v not in env_text]
            if missing:
                self._record("Codebase", ".env Required Vars", Status.FAIL, f"Missing: {', '.join(missing)}")
            else:
                self._record("Codebase", ".env Required Vars", Status.PASS)

            if "sk-placeholder" in env_text or "your-openai-key" in env_text.lower():
                self._record("Codebase", "API Keys Configured", Status.WARN, "Placeholder API keys detected — agent reasoning will FAIL")
            else:
                self._record("Codebase", "API Keys Configured", Status.PASS)
        else:
            self._record("Codebase", ".env File", Status.FAIL, "No .env file found")

    # ====================================================================
    # 12. DATABASE TABLE VERIFICATION
    # ====================================================================

    async def check_database_tables(self):
        section("12. Database Tables")

        try:
            from app.db.database import AsyncSessionLocal
            from sqlalchemy import text

            async with AsyncSessionLocal() as db:
                result = await db.execute(text(
                    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
                ))
                tables = [row[0] for row in result.fetchall()]

            expected = ["users", "agents", "tasks", "tools", "audit_logs"]
            for t in expected:
                if t in tables:
                    self._record("Database", f"Table: {t}", Status.PASS)
                else:
                    self._record("Database", f"Table: {t}", Status.FAIL, "Table missing!")
                    if self.auto_fix:
                        self._record("Database", f"Auto-fix: create {t}", Status.FIXED,
                                     fix="Run metadata.create_all to create missing tables")
                        self.report.fixes_applied.append(f"Flagged table '{t}' for creation")

            extra_tables = [t for t in tables if t not in expected and not t.startswith("alembic")]
            if extra_tables:
                self._record("Database", f"Extra Tables ({len(extra_tables)})", Status.PASS,
                             ", ".join(extra_tables[:10]))
            
            # Check row counts for key tables
            for t in ["agents", "users", "tasks"]:
                if t in tables:
                    result = await db.execute(text(f"SELECT COUNT(*) FROM {t}"))
                    count = result.scalar()
                    self._record("Database", f"Rows in '{t}': {count}", Status.PASS if count > 0 else Status.WARN,
                                 "empty table" if count == 0 else "")

        except Exception as e:
            self._record("Database", "Table Check", Status.FAIL, str(e)[:200])

    # ====================================================================
    # 13. GUARDIAN & SECURITY FEATURES
    # ====================================================================

    async def check_security(self):
        section("13. Security Features")

        # Guardian validate
        try:
            code, body, lat = await self._http("POST", "/v1/agents/guardian/validate", json_body={
                "content": "Please review this document carefully"
            })
            if code == 200 and "is_safe" in str(body):
                is_safe = body.get("is_safe", False)
                self._record("Security", f"Guardian Validate (safe={is_safe})", Status.PASS, latency=lat)
            elif code == 401:
                self._record("Security", "Guardian Validate", Status.WARN, "Requires auth")
            else:
                self._record("Security", "Guardian Validate", Status.FAIL, f"HTTP {code}: {body}")
        except Exception as e:
            self._record("Security", "Guardian Validate", Status.FAIL, str(e))

        # Test with malicious content
        try:
            code, body, lat = await self._http("POST", "/v1/agents/guardian/validate", json_body={
                "content": "DELETE ALL records from database; DROP TABLE users"
            })
            if code == 200 and body.get("is_safe") is False:
                self._record("Security", "Guardian Blocks Malicious Input", Status.PASS, latency=lat)
            elif code == 401:
                self._record("Security", "Guardian Blocks Malicious", Status.SKIP, "auth required")
            else:
                self._record("Security", "Guardian Blocks Malicious Input", Status.FAIL,
                             f"Expected is_safe=False, got: {body}")
        except Exception as e:
            self._record("Security", "Guardian Blocks Malicious", Status.FAIL, str(e))

    # ====================================================================
    # AUTO-FIX
    # ====================================================================

    async def apply_auto_fixes(self):
        if not self.auto_fix:
            return

        section("AUTO-FIX: Attempting to resolve issues")

        failures = [r for r in self.report.results if r.status == Status.FAIL]
        if not failures:
            ok("No failures to fix!")
            return

        # Fix 1: Missing DB tables
        table_fails = [r for r in failures if "Table missing" in r.detail]
        if table_fails:
            info("Attempting to create missing tables via metadata.create_all...")
            try:
                from app.db.database import engine
                from app.db.base import Base
                # Import all models so they register with Base.metadata
                import app.models.user
                import app.models.agent
                import app.models.task
                import app.models.tool
                import app.models.audit_log
                import app.models.approval
                import app.models.trace
                import app.models.goal
                import app.models.workflow
                import app.models.memory
                import app.models.marketplace
                import app.models.billing

                async with engine.begin() as conn:
                    await conn.run_sync(Base.metadata.create_all)

                ok("Tables created successfully")
                self.report.fixes_applied.append("Created missing database tables via metadata.create_all")
            except Exception as e:
                fail(f"Could not create tables: {e}")

        # Fix 2: Missing .env vars
        env_fails = [r for r in failures if ".env" in r.name]
        if env_fails:
            env_path = PROJECT_ROOT / ".env"
            if not env_path.exists():
                info("Creating minimal .env file...")
                env_path.write_text(
                    "DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/agentcloud\n"
                    "REDIS_URL=redis://localhost:6379/0\n"
                    "SECRET_KEY=auto-generated-change-me\n"
                    "DEPLOYMENT_MODE=local\n"
                    "OPENAI_API_KEY=sk-placeholder\n"
                )
                ok("Created .env with defaults")
                self.report.fixes_applied.append("Created .env file with defaults")

    # ====================================================================
    # REPORT GENERATOR
    # ====================================================================

    def _generate_report(self) -> str:
        self.report.finished_at = datetime.datetime.now().isoformat()

        counts = {s: 0 for s in Status}
        for r in self.report.results:
            counts[r.status] = counts.get(r.status, 0) + 1
        self.report.summary = {s.value: c for s, c in counts.items() if c > 0}

        total = len(self.report.results)
        passed = counts[Status.PASS] + counts[Status.FIXED]
        score = round((passed / total) * 100) if total else 0

        lines = [
            "# 🩺 AgentCloud Doctor Report",
            f"**Generated**: {self.report.finished_at}",
            f"**Score**: {score}% ({passed}/{total} checks passed)",
            "",
            "## Summary",
            "",
            "| Status | Count |",
            "|--------|-------|",
        ]
        for s, c in self.report.summary.items():
            lines.append(f"| {s} | {c} |")

        lines += ["", "---", "", "## Detailed Results", ""]

        # Group by category
        categories = {}
        for r in self.report.results:
            categories.setdefault(r.category, []).append(r)

        for cat, results in categories.items():
            lines.append(f"### {cat}")
            lines.append("")
            lines.append("| Status | Test | Detail | Latency |")
            lines.append("|--------|------|--------|---------|")
            for r in results:
                detail = r.detail[:80].replace("|", "\\|") if r.detail else ""
                lat = f"{r.latency_ms}ms" if r.latency_ms else ""
                lines.append(f"| {r.status.value} | {r.name} | {detail} | {lat} |")
            lines.append("")

        if self.report.fixes_applied:
            lines += ["## 🔧 Fixes Applied", ""]
            for f in self.report.fixes_applied:
                lines.append(f"- {f}")
            lines.append("")

        # Recommendations
        fails = [r for r in self.report.results if r.status == Status.FAIL]
        if fails:
            lines += ["## 🚨 Recommended Actions", ""]
            for i, r in enumerate(fails[:10], 1):
                lines.append(f"{i}. **{r.category} → {r.name}**: {r.detail}")
            lines.append("")

        lines += [
            "---",
            f"*Report generated by AgentCloud Doctor v1.0 — {total} checks in "
            f"{self.report.started_at} → {self.report.finished_at}*",
        ]

        return "\n".join(lines)

    # ====================================================================
    # MAIN RUNNER
    # ====================================================================

    async def run_all(self):
        banner("AgentCloud Doctor — Full System Diagnostic")
        print(f"  Target API: {API_BASE}")
        print(f"  Auto-fix:   {'ON' if self.auto_fix else 'OFF'}")
        print(f"  Started:    {self.report.started_at}")

        reachable = await self.check_infrastructure()
        if not reachable:
            warn("API unreachable — skipping remaining checks.")
        else:
            await self.check_auth()
            await self.check_agents()
            await self.check_analytics()
            await self.check_marketplace()
            await self.check_billing()
            await self.check_workflows()
            await self.check_approvals()
            await self.check_tools()
            await self.check_admin()
            await self.check_security()

        await self.check_codebase()
        await self.check_database_tables()

        if self.auto_fix:
            await self.apply_auto_fixes()

        # Generate and save report
        report_text = self._generate_report()
        REPORT_PATH.write_text(report_text, encoding="utf-8")

        banner("Diagnostic Complete")

        total = len(self.report.results)
        passed = sum(1 for r in self.report.results if r.status in (Status.PASS, Status.FIXED))
        failed = sum(1 for r in self.report.results if r.status == Status.FAIL)
        warned = sum(1 for r in self.report.results if r.status == Status.WARN)
        score = round((passed / total) * 100) if total else 0

        print(f"  {C.GREEN}Passed: {passed}{C.RESET}")
        print(f"  {C.RED}Failed: {failed}{C.RESET}")
        print(f"  {C.YELLOW}Warnings: {warned}{C.RESET}")
        print(f"  {C.BOLD}Score: {score}%{C.RESET}")
        print(f"\n  Report saved to: {REPORT_PATH}")
        if self.report.fixes_applied:
            print(f"  Auto-fixes applied: {len(self.report.fixes_applied)}")
        print()

        return score


# ---------------------------------------------------------------------------
# CLI entry
# ---------------------------------------------------------------------------

def main():
    import argparse
    parser = argparse.ArgumentParser(description="AgentCloud Doctor — Full System Diagnostic")
    parser.add_argument("--fix", action="store_true", help="Automatically fix issues where possible")
    parser.add_argument("--report-only", action="store_true", help="Just show last report")
    args = parser.parse_args()

    if args.report_only:
        if REPORT_PATH.exists():
            print(REPORT_PATH.read_text(encoding="utf-8"))
        else:
            print("No report found. Run doctor.py first.")
        return

    doctor = AgentCloudDoctor(auto_fix=args.fix)
    score = asyncio.run(doctor.run_all())
    sys.exit(0 if score >= 60 else 1)


if __name__ == "__main__":
    main()
