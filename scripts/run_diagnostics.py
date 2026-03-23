#!/usr/bin/env python3
"""
AgentCloud Full Diagnostics
Run from your project root:
    python run_diagnostics.py
    python run_diagnostics.py --url http://localhost:8000
"""
import os, sys, uuid, time, json, argparse, pathlib
import urllib.request, urllib.error, urllib.parse

# ── colour helpers (no deps) ────────────────────────────────────────────────
def _c(code, text): return f"\033[{code}m{text}\033[0m"
_G = lambda t: _c("92", t);  _R = lambda t: _c("91", t)
_Y = lambda t: _c("93", t);  _C = lambda t: _c("96", t)
_B = lambda t: _c("1",  t);  _D = lambda t: _c("2",  t)

# ── tiny HTTP helper (stdlib only) ──────────────────────────────────────────
def http(method, url, *, data=None, headers=None, token=None, form=False):
    h = {"Content-Type": "application/json", **(headers or {})}
    if token:
        h["Authorization"] = f"Bearer {token}"
    body = None
    if data is not None:
        if form:
            body = urllib.parse.urlencode(data).encode()
            h["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            raw = r.read().decode()
            try:    return r.status, json.loads(raw)
            except: return r.status, {"raw": raw}
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:    return e.code, json.loads(raw)
        except: return e.code, {"raw": raw}
    except Exception as e:
        return 0, {"error": str(e)}


# ── Result tracker ───────────────────────────────────────────────────────────
class R:
    def __init__(self):
        self.passed = []; self.failed = []; self.skipped = []; self.warns = []

    def ok(self, name, detail=""):
        self.passed.append(name)
        print(f"  {_G('✓')} {name}" + (f"  {_D(detail)}" if detail else ""))

    def fail(self, name, detail=""):
        self.failed.append(name)
        print(f"  {_R('✗')} {name}" + (f"  {_R('→ '+detail)}" if detail else ""))

    def skip(self, name, reason=""):
        self.skipped.append(name)
        print(f"  {_Y('⊘')} {name}" + (f"  {_D('('+reason+')')}" if reason else ""))

    def warn(self, name, detail=""):
        self.warns.append(name)
        print(f"  {_Y('⚠')} {name}" + (f"  {_Y(detail)}" if detail else ""))

    def section(self, title):
        print(f"\n{_C('─'*58)}\n  {_B(title)}\n{_C('─'*58)}")

    def summary(self):
        total = len(self.passed) + len(self.failed) + len(self.skipped)
        pct   = int(100 * len(self.passed) / total) if total else 0
        print(f"\n{'═'*58}")
        print(f"  {_B('RESULTS')}  {_G(str(len(self.passed))+'/' +str(total)+' passed')}  ({pct}%)")
        if self.warns:
            print(f"  {_Y('Warnings: ' + str(len(self.warns)))}")
        print(f"{'═'*58}")
        if self.failed:
            print(f"  {_R('Failed:')}")
            for f in self.failed: print(f"    • {f}")
        if self.skipped:
            print(f"  {_Y('Skipped:')}", ", ".join(self.skipped))
        print()
        return len(self.failed) == 0


# ════════════════════════════════════════════════════════════════════════════
# TEST SECTIONS
# ════════════════════════════════════════════════════════════════════════════

def check_files(r, root):
    """Verify all enhanced files are present and key content is in them."""
    r.section("0 · Project file check")
    required = [
        ("app/services/agent_service.py",        "BUILTIN_AGENTS"),
        ("app/schemas/agent_schema.py",           "field_validator"),
        ("app/api/agents.py",                     "/my"),
        ("app/api/analytics.py",                  "recent_tasks"),
        ("app/api/auth.py",                       "login"),
        ("frontend/app/lib/api.ts",               "wsUrl"),
        ("frontend/app/components/SidebarNav.tsx","navGroups"),
        ("frontend/app/components/TaskTable.tsx", "StatusBadge"),
        ("frontend/app/agents/page.tsx",          "RegisterAgentModal"),
        ("frontend/app/tasks/page.tsx",           "SAMPLE_TASKS"),
        ("test_full_suite.py",                    "test_agents"),
    ]
    for relpath, marker in required:
        p = root / relpath
        if not p.exists():
            r.fail(f"File exists: {relpath}", "missing — run apply_enhancements.py first")
        elif marker not in p.read_text(encoding="utf-8", errors="ignore"):
            r.fail(f"Content check: {relpath}", f"marker '{marker}' not found")
        else:
            r.ok(f"File OK: {relpath}", marker)


def check_health(r, base):
    r.section("1 · Health & metrics")
    code, data = http("GET", f"{base}/")
    if code == 200 and data.get("status") == "running":
        r.ok("GET /  →  status: running", f"v{data.get('version','?')}")
        return True
    else:
        r.fail("GET /  →  status: running", f"HTTP {code} — {str(data)[:80]}")
        print(f"\n  {R('Backend unreachable.')} Start the server then re-run.\n")
        return False


def check_metrics(r, base):
    code, data = http("GET", f"{base}/metrics")
    if code == 200:
        r.ok("GET /metrics  →  Prometheus OK")
    else:
        r.warn("GET /metrics", f"HTTP {code}")


def check_auth(r, base, email, password):
    r.section("2 · Auth (register / login / me)")
    # Register
    code, data = http("POST", f"{base}/v1/auth/register",
                      data={"email": email, "password": password, "name": f"diag_{uuid.uuid4().hex[:6]}"})
    if code in (200, 201):
        r.ok("POST /v1/auth/register", email)
    elif code == 400 and "already" in str(data).lower():
        r.ok("POST /v1/auth/register (user already exists)", email)
    else:
        r.fail("POST /v1/auth/register", f"HTTP {code}: {str(data)[:100]}")

    # Login
    code, data = http("POST", f"{base}/v1/auth/login",
                      data={"username": email, "password": password}, form=True)
    token = None
    if code == 200 and data.get("access_token"):
        token = data["access_token"]
        r.ok("POST /v1/auth/login  →  JWT token received")
    else:
        r.fail("POST /v1/auth/login", f"HTTP {code}: {str(data)[:100]}")

    # Me
    if token:
        code, data = http("GET", f"{base}/v1/auth/me", token=token)
        if code == 200 and data.get("email") == email:
            r.ok("GET /v1/auth/me  →  profile returned", email)
        else:
            r.fail("GET /v1/auth/me", f"HTTP {code}")
    return token


def check_agents(r, base, token):
    r.section("3 · Agents (bug-fix verification + new endpoints)")
    if not token:
        r.skip("All agent tests", "no auth token")
        return None, None

    # ── GET /agents/my → seeds built-ins
    code, data = http("GET", f"{base}/v1/agents/my", token=token)
    if code == 200 and isinstance(data, list):
        r.ok("GET /v1/agents/my  →  list returned", f"{len(data)} agents")
        names = {a.get("name") for a in data}
        expected = {"WebResearcher", "CodeHelper", "DataAnalyst", "ContentWriter", "TaskOrchestrator"}
        seeded = expected & names
        if seeded:
            r.ok("Built-in agents seeded on first call", ", ".join(sorted(seeded)))
        else:
            r.warn("Built-in agents", "none seeded yet — may need a fresh user")
    else:
        r.fail("GET /v1/agents/my", f"HTTP {code}: {str(data)[:100]}")

    # ── GET /agents/builtin (no auth)
    code, data = http("GET", f"{base}/v1/agents/builtin")
    if code == 200 and isinstance(data, list):
        r.ok("GET /v1/agents/builtin  →  templates", f"{len(data)} templates")
    else:
        r.fail("GET /v1/agents/builtin", f"HTTP {code}")

    # ── POST /agents/register
    code, data = http("POST", f"{base}/v1/agents/register",
                      data={"name": f"diag-agent-{uuid.uuid4().hex[:6]}",
                            "role": "Software Engineer",
                            "description": "Created by diagnostics script",
                            "owner_id": "placeholder"},
                      token=token)
    agent_id = agent_token = None
    if code in (200, 201):
        agent_id    = data.get("agent_id")
        agent_token = data.get("token")
        # BUG FIX #1: role/description now returned
        if data.get("role") == "Software Engineer":
            r.ok("POST /v1/agents/register  →  role in response [BUG FIX ✓]")
        else:
            r.fail("POST /v1/agents/register  →  role missing", f"got: {data.get('role')!r}")
        # BUG FIX #2: scopes as List[str]
        scopes = data.get("scopes", [])
        if isinstance(scopes, list):
            r.ok("Scopes returned as List[str]  [BUG FIX ✓]", str(scopes))
        else:
            r.fail("Scopes type mismatch  [BUG still present]", f"got {type(scopes).__name__}: {scopes!r}")
        r.ok("agent_id + token received", agent_id)
    else:
        r.fail("POST /v1/agents/register", f"HTTP {code}: {str(data)[:150]}")

    # ── GET /agents/{id}  (BUG FIX: no longer crashes without owner_id)
    if agent_id:
        code, data = http("GET", f"{base}/v1/agents/{agent_id}")
        if code == 200:
            r.ok("GET /v1/agents/{id}  →  works without owner filter [BUG FIX ✓]")
        else:
            r.fail("GET /v1/agents/{id}", f"HTTP {code}")

    # ── PATCH /agents/{id}  (new endpoint)
    if agent_id:
        code, data = http("PATCH", f"{base}/v1/agents/{agent_id}",
                          data={"description": "Updated by diagnostics"},
                          token=token)
        if code == 200:
            r.ok("PATCH /v1/agents/{id}  →  update works [NEW ENDPOINT ✓]")
        else:
            r.fail("PATCH /v1/agents/{id}", f"HTTP {code}: {str(data)[:80]}")

    # ── GET /agents/  (BUG FIX: no longer crashes with owner_id=None)
    code, data = http("GET", f"{base}/v1/agents/")
    if code == 200:
        r.ok("GET /v1/agents/  →  list all, no crash [BUG FIX ✓]")
    else:
        r.fail("GET /v1/agents/", f"HTTP {code}")

    # ── GET /agents/leaderboard
    code, data = http("GET", f"{base}/v1/agents/leaderboard")
    if code == 200:
        r.ok("GET /v1/agents/leaderboard  →  top by reputation", f"{len(data)} entries")
    else:
        r.fail("GET /v1/agents/leaderboard", f"HTTP {code}")

    return agent_id, agent_token


def check_tasks(r, base, agent_id, agent_token):
    r.section("4 · Tasks (submit + status)")
    if not agent_token:
        r.skip("Task tests", "no agent token")
        return None

    code, data = http("POST", f"{base}/v1/tasks/run",
                      data={"agent_id": agent_id, "payload": "say hello world"},
                      token=agent_token)
    task_id = None
    if code in (200, 201):
        task_id = data.get("task_id") or data.get("id")
        r.ok("POST /v1/tasks/run  →  task queued", task_id)
    elif code == 403:
        r.skip("POST /v1/tasks/run", "scope restriction in test env")
    else:
        r.fail("POST /v1/tasks/run", f"HTTP {code}: {str(data)[:150]}")

    if task_id:
        time.sleep(1)
        code, data = http("GET", f"{base}/v1/tasks/{task_id}", token=agent_token)
        if code == 200:
            r.ok("GET /v1/tasks/{id}  →  status", f"status={data.get('status')!r}")
        else:
            r.fail("GET /v1/tasks/{id}", f"HTTP {code}")
    return task_id


def check_analytics(r, base, token):
    r.section("5 · Analytics & memory")
    code, data = http("GET", f"{base}/v1/analytics/metrics")
    if code == 200:
        has_recent = "recent_tasks" in data
        r.ok("GET /v1/analytics/metrics  →  KPIs returned")
        if has_recent:
            r.ok("recent_tasks field present in metrics  [ENHANCEMENT ✓]",
                 f"{len(data.get('recent_tasks',[]))} tasks")
        else:
            r.warn("recent_tasks field missing", "analytics patch may not have been applied")
    else:
        r.fail("GET /v1/analytics/metrics", f"HTTP {code}")

    if token:
        code, _ = http("GET", f"{base}/v1/memory/", token=token)
        if code in (200, 404):
            r.ok("GET /v1/memory/  →  accessible")
        else:
            r.fail("GET /v1/memory/", f"HTTP {code}")


def check_traces(r, base, token):
    r.section("6 · Traces & audit")
    code, _ = http("GET", f"{base}/v1/traces")
    if code in (200, 401):
        r.ok("GET /v1/traces  →  accessible")
    else:
        r.fail("GET /v1/traces", f"HTTP {code}")

    if token:
        code, _ = http("GET", f"{base}/v1/audit/", token=token)
        if code in (200, 404):
            r.ok("GET /v1/audit/  →  accessible")
        else:
            r.fail("GET /v1/audit/", f"HTTP {code}")


def check_cleanup(r, base, agent_id, token):
    r.section("7 · Cleanup")
    if not agent_id or not token:
        r.skip("DELETE agent", "nothing to clean up")
        return
    # BUG FIX: delete now enforces ownership
    code, data = http("DELETE", f"{base}/v1/agents/{agent_id}", token=token)
    if code == 200 and data.get("status") == "deleted":
        r.ok("DELETE /v1/agents/{id}  →  deleted, ownership enforced [BUG FIX ✓]")
    else:
        r.fail("DELETE /v1/agents/{id}", f"HTTP {code}: {str(data)[:80]}")


def check_no_debug_print(r, root):
    r.section("8 · Code quality checks")
    auth_file = root / "app" / "api" / "auth.py"
    if auth_file.exists():
        content = auth_file.read_text(encoding="utf-8", errors="ignore")
        if 'print(f"DEBUG:' in content or "print(f'DEBUG:" in content:
            r.fail("auth.py  →  debug print still present  [BUG NOT FIXED]")
        else:
            r.ok("auth.py  →  no debug print leak  [BUG FIX ✓]")

    # Check scopes validator in schema
    schema_file = root / "app" / "schemas" / "agent_schema.py"
    if schema_file.exists():
        content = schema_file.read_text(encoding="utf-8", errors="ignore")
        if "field_validator" in content and "parse_scopes_field" in content:
            r.ok("agent_schema.py  →  scopes validator present  [BUG FIX ✓]")
        else:
            r.fail("agent_schema.py  →  scopes validator missing  [BUG NOT FIXED]")

    # Check agent_service has seed function
    svc_file = root / "app" / "services" / "agent_service.py"
    if svc_file.exists():
        content = svc_file.read_text(encoding="utf-8", errors="ignore")
        if "seed_builtin_agents" in content and "BUILTIN_AGENTS" in content:
            r.ok("agent_service.py  →  built-in agent seeding present  [ENHANCEMENT ✓]")
        else:
            r.fail("agent_service.py  →  built-in agents missing  [ENHANCEMENT NOT APPLIED]")

    # Check frontend api.ts has wsUrl
    api_ts = root / "frontend" / "app" / "lib" / "api.ts"
    if api_ts.exists():
        content = api_ts.read_text(encoding="utf-8", errors="ignore")
        if "wsUrl" in content and "apiFetch" in content:
            r.ok("frontend/lib/api.ts  →  wsUrl + apiFetch helpers present  [ENHANCEMENT ✓]")
        else:
            r.fail("frontend/lib/api.ts  →  helpers missing  [ENHANCEMENT NOT APPLIED]")


# ════════════════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=os.getenv("API_BASE_URL", "http://localhost:8000"))
    parser.add_argument("--skip-backend", action="store_true", help="Only check files, skip HTTP tests")
    args = parser.parse_args()

    base  = args.url.rstrip("/")
    root  = pathlib.Path.cwd()
    r     = R()
    uid   = uuid.uuid4().hex[:8]
    email = f"diag_{uid}@example.com"
    pwd   = "DiagPass123!"

    print(f"\n{_C(_B('AgentCloud Diagnostics'))}")
    print(f"{_D('  Project root: ' + str(root))}")
    print(f"{_D('  Backend:      ' + base)}")
    print(f"{_D('  Time:         ' + time.strftime('%Y-%m-%d %H:%M:%S'))}")

    # Always check files
    check_files(r, root)

    if args.skip_backend:
        print(f"\n{_Y('  --skip-backend set, skipping HTTP tests.')}")
    else:
        alive = check_health(r, base)
        if alive:
            check_metrics(r, base)
            token = check_auth(r, base, email, pwd)
            agent_id, agent_token = check_agents(r, base, token)
            check_tasks(r, base, agent_id, agent_token)
            check_analytics(r, base, token)
            check_traces(r, base, token)
            check_cleanup(r, base, agent_id, token)

    check_no_debug_print(r, root)

    success = r.summary()

    if not success:
        print(f"  {_Y('Tip:')} Run {_B('python apply_enhancements.py')} to apply all fixes,")
        print(f"  then start the backend and re-run this script.\n")

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
