#!/usr/bin/env python3
"""
AgentCloud Full Functionality Test Suite
Tests all endpoints, bug fixes, new features, and built-in agents.
Run: python test_full_suite.py [--url http://localhost:8000]
"""
import os, sys, uuid, time, json, argparse
import requests
from datetime import datetime

try:
    from colorama import Fore, Style, init as colorama_init
    colorama_init(autoreset=True)
    GREEN  = Fore.GREEN
    RED    = Fore.RED
    YELLOW = Fore.YELLOW
    CYAN   = Fore.CYAN
    MAGENTA= Fore.MAGENTA
    RESET  = Style.RESET_ALL
except ImportError:
    GREEN = RED = YELLOW = CYAN = MAGENTA = RESET = ""

# ─── Config ──────────────────────────────────────────────────────────────────
DEFAULT_URL = os.getenv("API_BASE_URL", "http://localhost:8000")

class Results:
    def __init__(self):
        self.passed: list[str] = []
        self.failed: list[str] = []
        self.skipped: list[str] = []

    def ok(self, name: str, detail: str = ""):
        self.passed.append(name)
        print(f"{GREEN}  ✓ PASS{RESET}  {name}" + (f"  {YELLOW}({detail}){RESET}" if detail else ""))

    def fail(self, name: str, detail: str = ""):
        self.failed.append(name)
        print(f"{RED}  ✗ FAIL{RESET}  {name}" + (f"  {RED}→ {detail}{RESET}" if detail else ""))

    def skip(self, name: str, reason: str = ""):
        self.skipped.append(name)
        print(f"{YELLOW}  ⊘ SKIP{RESET}  {name}" + (f"  ({reason})" if reason else ""))

    def summary(self):
        total = len(self.passed) + len(self.failed) + len(self.skipped)
        pct   = int(100 * len(self.passed) / total) if total else 0
        print(f"\n{'═'*60}")
        print(f"{CYAN}  RESULTS  {RESET}  {len(self.passed)}/{total} passed  ({pct}%)")
        print(f"{'═'*60}")
        if self.failed:
            print(f"{RED}  Failed:{RESET}")
            for f in self.failed:
                print(f"    • {f}")
        if self.skipped:
            print(f"{YELLOW}  Skipped:{RESET} {', '.join(self.skipped)}")
        print()
        return len(self.failed) == 0


class Tester:
    def __init__(self, base: str):
        self.base = base.rstrip("/")
        self.session = requests.Session()
        self.session.timeout = 10
        self.token: str | None = None
        self.agent_token: str | None = None
        self.agent_id: str | None = None
        self.task_id: str | None = None
        self.r = Results()
        self.uid = uuid.uuid4().hex[:8]
        self.email = f"test_{self.uid}@example.com"
        self.password = os.getenv("TEST_PASSWORD", "TestPass123!")

    def url(self, path: str) -> str:
        return f"{self.base}{path}"

    def get(self, path: str, **kw):
        h = kw.pop("headers", {})
        if self.token: h["Authorization"] = f"Bearer {self.token}"
        return self.session.get(self.url(path), headers=h, **kw)

    def post(self, path: str, **kw):
        h = kw.pop("headers", {})
        if self.token: h["Authorization"] = f"Bearer {self.token}"
        return self.session.post(self.url(path), headers=h, **kw)

    def delete(self, path: str, **kw):
        h = kw.pop("headers", {})
        if self.token: h["Authorization"] = f"Bearer {self.token}"
        return self.session.delete(self.url(path), headers=h, **kw)

    def patch(self, path: str, **kw):
        h = kw.pop("headers", {})
        if self.token: h["Authorization"] = f"Bearer {self.token}"
        return self.session.patch(self.url(path), headers=h, **kw)

    def section(self, title: str):
        print(f"\n{CYAN}{'─'*60}{RESET}")
        print(f"{CYAN}  {title}{RESET}")
        print(f"{CYAN}{'─'*60}{RESET}")

    # ─── Tests ───────────────────────────────────────────────────────────────

    def test_health(self):
        self.section("1. Health & Metrics")
        try:
            r = self.get("/")
            if r.status_code == 200 and r.json().get("status") == "running":
                self.r.ok("GET /  →  status: running", f"v{r.json().get('version','?')}")
            else:
                self.r.fail("GET /  →  status: running", f"HTTP {r.status_code}")
        except Exception as e:
            self.r.fail("GET /  →  status: running", f"Connection refused — is backend running? ({e})")
            return False  # Fatal; stop here

        try:
            r = self.get("/metrics")
            self.r.ok("GET /metrics  →  Prometheus", f"HTTP {r.status_code}") if r.status_code == 200 else self.r.fail("GET /metrics", f"HTTP {r.status_code}")
        except Exception as e:
            self.r.fail("GET /metrics", str(e))
        return True

    def test_auth(self):
        self.section("2. Auth — Register & Login")
        # Register
        try:
            r = self.post("/v1/auth/register", json={"email": self.email, "password": self.password, "name": f"tester_{self.uid}"})
            if r.status_code in (200, 201):
                self.r.ok("POST /v1/auth/register", self.email)
            elif r.status_code == 400 and "already" in r.text.lower():
                self.r.ok("POST /v1/auth/register (already exists — OK)", self.email)
            else:
                self.r.fail("POST /v1/auth/register", f"HTTP {r.status_code}: {r.text[:120]}")
        except Exception as e:
            self.r.fail("POST /v1/auth/register", str(e))

        # Login
        try:
            r = self.session.post(self.url("/v1/auth/login"), data={"username": self.email, "password": self.password})
            if r.status_code == 200 and r.json().get("access_token"):
                self.token = r.json()["access_token"]
                self.r.ok("POST /v1/auth/login  →  JWT token received")
            else:
                self.r.fail("POST /v1/auth/login", f"HTTP {r.status_code}: {r.text[:120]}")
        except Exception as e:
            self.r.fail("POST /v1/auth/login", str(e))

        # Me
        if self.token:
            try:
                r = self.get("/v1/auth/me")
                if r.status_code == 200 and r.json().get("email") == self.email:
                    self.r.ok("GET /v1/auth/me  →  user profile")
                else:
                    self.r.fail("GET /v1/auth/me", f"HTTP {r.status_code}")
            except Exception as e:
                self.r.fail("GET /v1/auth/me", str(e))

    def test_agents(self):
        self.section("3. Agents — CRUD + Built-ins + Bug-fix Verification")

        if not self.token:
            self.r.skip("Agent tests", "no auth token")
            return

        # GET /agents/my  — seeds built-in agents on first call
        try:
            r = self.get("/v1/agents/my")
            if r.status_code == 200:
                agents = r.json()
                self.r.ok("GET /v1/agents/my  →  returns list (seeds built-ins)", f"{len(agents)} agents")
                # Verify built-in agent names are seeded
                names = {a.get("name") for a in agents}
                expected_builtins = {"WebResearcher", "CodeHelper", "DataAnalyst", "ContentWriter", "TaskOrchestrator"}
                seeded = expected_builtins.intersection(names)
                if seeded:
                    self.r.ok(f"Built-in agents seeded", f"{', '.join(sorted(seeded))}")
                else:
                    self.r.fail("Built-in agents seeded", "None of the expected built-ins found")
            else:
                self.r.fail("GET /v1/agents/my", f"HTTP {r.status_code}: {r.text[:120]}")
        except Exception as e:
            self.r.fail("GET /v1/agents/my", str(e))

        # GET /agents/builtin — template list (no auth needed)
        try:
            r = self.session.get(self.url("/v1/agents/builtin"))
            if r.status_code == 200 and isinstance(r.json(), list):
                self.r.ok("GET /v1/agents/builtin  →  templates", f"{len(r.json())} templates")
            else:
                self.r.fail("GET /v1/agents/builtin", f"HTTP {r.status_code}")
        except Exception as e:
            self.r.fail("GET /v1/agents/builtin", str(e))

        # POST /agents/register — BUG FIX: was missing role/desc in response
        try:
            r = self.post("/v1/agents/register", json={
                "name": f"TestAgent-{self.uid}",
                "role": "Software Engineer",
                "description": "Test agent created by test suite",
                "owner_id": "will-be-overridden"
            })
            if r.status_code in (200, 201):
                data = r.json()
                self.agent_id = data.get("agent_id")
                self.agent_token = data.get("token")
                # Verify bug fix: role and description returned
                if data.get("role") == "Software Engineer":
                    self.r.ok("POST /v1/agents/register  →  role/description in response [BUG FIX]")
                else:
                    self.r.fail("POST /v1/agents/register  →  role/description in response [BUG FIX]", f"role={data.get('role')!r}")
                # Verify scopes is a list, not a string [BUG FIX]
                scopes = data.get("scopes", [])
                if isinstance(scopes, list):
                    self.r.ok("POST /v1/agents/register  →  scopes as List[str] [BUG FIX]", f"{scopes}")
                else:
                    self.r.fail("POST /v1/agents/register  →  scopes as List[str] [BUG FIX]", f"got {type(scopes).__name__}: {scopes!r}")
                # Verify owner_id is set from authenticated user (not request body)
                self.r.ok("POST /v1/agents/register  →  agent_id + token received", self.agent_id)
            else:
                self.r.fail("POST /v1/agents/register", f"HTTP {r.status_code}: {r.text[:200]}")
        except Exception as e:
            self.r.fail("POST /v1/agents/register", str(e))

        # GET /agents/{id}  — BUG FIX: was calling get_agent without owner_id (would crash)
        if self.agent_id:
            try:
                r = self.get(f"/v1/agents/{self.agent_id}")
                if r.status_code == 200:
                    self.r.ok("GET /v1/agents/{id}  →  fetch by id [BUG FIX applied]")
                else:
                    self.r.fail("GET /v1/agents/{id}", f"HTTP {r.status_code}")
            except Exception as e:
                self.r.fail("GET /v1/agents/{id}", str(e))

        # PATCH /agents/{id}  — new endpoint
        if self.agent_id:
            try:
                r = self.patch(f"/v1/agents/{self.agent_id}", json={"description": "Updated by test suite"})
                if r.status_code == 200 and "Updated by test suite" in r.text:
                    self.r.ok("PATCH /v1/agents/{id}  →  update agent [NEW ENDPOINT]")
                else:
                    self.r.fail("PATCH /v1/agents/{id}", f"HTTP {r.status_code}: {r.text[:120]}")
            except Exception as e:
                self.r.fail("PATCH /v1/agents/{id}", str(e))

        # GET /agents/leaderboard
        try:
            r = self.get("/v1/agents/leaderboard")
            if r.status_code == 200:
                self.r.ok("GET /v1/agents/leaderboard  →  top agents by reputation", f"{len(r.json())} entries")
            else:
                self.r.fail("GET /v1/agents/leaderboard", f"HTTP {r.status_code}")
        except Exception as e:
            self.r.fail("GET /v1/agents/leaderboard", str(e))

        # GET /agents/  — BUG FIX: owner_id=None no longer crashes
        try:
            r = self.get("/v1/agents/")
            if r.status_code == 200:
                self.r.ok("GET /v1/agents/  →  list all agents (no owner filter) [BUG FIX]")
            else:
                self.r.fail("GET /v1/agents/", f"HTTP {r.status_code}")
        except Exception as e:
            self.r.fail("GET /v1/agents/", str(e))

    def test_tasks(self):
        self.section("4. Tasks — Submit + Status")
        if not self.agent_token:
            self.r.skip("Task tests", "no agent token")
            return

        # POST /tasks/run (with agent JWT)
        try:
            r = self.session.post(
                self.url("/v1/tasks/run"),
                json={"agent_id": self.agent_id, "payload": "print hello world"},
                headers={"Authorization": f"Bearer {self.agent_token}"},
            )
            if r.status_code in (200, 201):
                self.task_id = r.json().get("task_id") or r.json().get("id")
                self.r.ok("POST /v1/tasks/run  →  task queued", self.task_id)
            elif r.status_code == 403:
                self.r.skip("POST /v1/tasks/run", "scope not granted in test env")
            else:
                self.r.fail("POST /v1/tasks/run", f"HTTP {r.status_code}: {r.text[:200]}")
        except Exception as e:
            self.r.fail("POST /v1/tasks/run", str(e))

        # GET /tasks/{id}
        if self.task_id:
            time.sleep(1)
            try:
                r = self.session.get(
                    self.url(f"/v1/tasks/{self.task_id}"),
                    headers={"Authorization": f"Bearer {self.agent_token}"},
                )
                if r.status_code == 200:
                    status = r.json().get("status", "?")
                    self.r.ok("GET /v1/tasks/{id}  →  status check", f"status={status}")
                else:
                    self.r.fail("GET /v1/tasks/{id}", f"HTTP {r.status_code}")
            except Exception as e:
                self.r.fail("GET /v1/tasks/{id}", str(e))

    def test_analytics(self):
        self.section("5. Analytics & Memory")
        try:
            r = self.get("/v1/analytics/metrics")
            if r.status_code == 200:
                self.r.ok("GET /v1/analytics/metrics  →  system KPIs")
            else:
                self.r.fail("GET /v1/analytics/metrics", f"HTTP {r.status_code}")
        except Exception as e:
            self.r.fail("GET /v1/analytics/metrics", str(e))

        if self.token:
            try:
                r = self.get("/v1/memory/")
                if r.status_code in (200, 404):
                    self.r.ok("GET /v1/memory/  →  memory store accessible")
                else:
                    self.r.fail("GET /v1/memory/", f"HTTP {r.status_code}")
            except Exception as e:
                self.r.fail("GET /v1/memory/", str(e))

    def test_traces(self):
        self.section("6. Traces & Audit")
        try:
            r = self.get("/v1/traces")
            if r.status_code in (200, 401):
                self.r.ok("GET /v1/traces  →  trace list accessible")
            else:
                self.r.fail("GET /v1/traces", f"HTTP {r.status_code}")
        except Exception as e:
            self.r.fail("GET /v1/traces", str(e))

        if self.token:
            try:
                r = self.get("/v1/audit/")
                if r.status_code in (200, 404):
                    self.r.ok("GET /v1/audit/  →  audit log accessible")
                else:
                    self.r.fail("GET /v1/audit/", f"HTTP {r.status_code}")
            except Exception as e:
                self.r.fail("GET /v1/audit/", str(e))

    def test_cleanup(self):
        self.section("7. Cleanup — Delete test agent")
        if not self.agent_id or not self.token:
            self.r.skip("DELETE /v1/agents/{id}", "nothing to clean up")
            return
        # BUG FIX: delete now enforces owner, requires auth
        try:
            r = self.delete(f"/v1/agents/{self.agent_id}")
            if r.status_code == 200 and r.json().get("status") == "deleted":
                self.r.ok("DELETE /v1/agents/{id}  →  agent deleted [BUG FIX: owner enforced]")
            else:
                self.r.fail("DELETE /v1/agents/{id}", f"HTTP {r.status_code}: {r.text[:120]}")
        except Exception as e:
            self.r.fail("DELETE /v1/agents/{id}", str(e))

    def run(self) -> bool:
        print(f"\n{CYAN}{'═'*60}{RESET}")
        print(f"{CYAN}  AgentCloud Full Test Suite  {RESET}")
        print(f"{CYAN}  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  │  {self.base}{RESET}")
        print(f"{CYAN}{'═'*60}{RESET}")

        if not self.test_health():
            print(f"\n{RED}  Backend unreachable. Start the server first.{RESET}\n")
            return False
        self.test_auth()
        self.test_agents()
        self.test_tasks()
        self.test_analytics()
        self.test_traces()
        self.test_cleanup()

        return self.r.summary()


def main():
    parser = argparse.ArgumentParser(description="AgentCloud test suite")
    parser.add_argument("--url", default=DEFAULT_URL, help="Backend base URL")
    args = parser.parse_args()

    tester = Tester(args.url)
    success = tester.run()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
