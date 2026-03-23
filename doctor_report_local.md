# 🩺 AgentCloud Doctor Report
**Generated**: 2026-03-23T08:16:52.896511
**Score**: 41% (21/51 checks passed)

## Summary

| Status | Count |
|--------|-------|
| ✅ PASS | 16 |
| ❌ FAIL | 17 |
| ⚠️  WARN | 7 |
| 🔧 FIXED | 5 |
| ⏭️  SKIP | 6 |

---

## Detailed Results

### Infrastructure

| Status | Test | Detail | Latency |
|--------|------|--------|---------|
| ✅ PASS | API Health Endpoint |  | 10.6ms |
| ✅ PASS | PostgreSQL Connection |  | 6.9ms |
| ✅ PASS | Redis Connection |  | 4.1ms |
| ✅ PASS | Prometheus Metrics |  | 7.7ms |
| ⚠️  WARN | Docker Check | docker not available: [Errno 2] No such file or directory: 'docker' |  |

### Auth

| Status | Test | Detail | Latency |
|--------|------|--------|---------|
| ❌ FAIL | User Registration | HTTP 500: {'message': 'An internal server error occurred. Please contact support |  |
| ❌ FAIL | User Login (JWT) | HTTP 500: {'message': 'An internal server error occurred. Please contact support |  |
| ⏭️  SKIP | Authenticated Endpoint | No token available |  |

### Agents

| Status | Test | Detail | Latency |
|--------|------|--------|---------|
| ❌ FAIL | Create Agent | HTTP 401: {'detail': 'Invalid authentication (Token or API Key)'} |  |
| ❌ FAIL | List Agents | HTTP 500: {'message': 'An internal server error occurred. Please contact support |  |
| ⏭️  SKIP | Get Agent by ID | No test agent created |  |
| ⏭️  SKIP | Update Agent | No test agent created |  |
| ⏭️  SKIP | Agent Metrics | No test agent created |  |
| ⏭️  SKIP | Agent Task History | No test agent created |  |
| ✅ PASS | Builtin Templates (7 found) |  | 14.7ms |
| ❌ FAIL | Agent Leaderboard | HTTP 500 |  |

### Analytics

| Status | Test | Detail | Latency |
|--------|------|--------|---------|
| ❌ FAIL | Analytics Metrics | HTTP 500: {'message': 'An internal server error occurred. Please contact support |  |
| ❌ FAIL | Traces List | HTTP 500: {'message': 'An internal server error occurred. Please contact support |  |

### Marketplace

| Status | Test | Detail | Latency |
|--------|------|--------|---------|
| ❌ FAIL | List Templates | HTTP 500: {'message': 'An internal server error occurred. Please contact support |  |
| ❌ FAIL | Featured Agents | HTTP 500 |  |

### Billing

| Status | Test | Detail | Latency |
|--------|------|--------|---------|
| ⚠️  WARN | Subscription Info | Requires auth |  |
| ⚠️  WARN | Usage Report | Requires auth |  |

### Workflows

| Status | Test | Detail | Latency |
|--------|------|--------|---------|
| ✅ PASS | Workflows Endpoint |  | 7.3ms |
| ⚠️  WARN | List Goals | Requires auth |  |

### HITL

| Status | Test | Detail | Latency |
|--------|------|--------|---------|
| ❌ FAIL | List Pending Approvals | HTTP 500: {'message': 'An internal server error occurred. Please contact support |  |

### Tools

| Status | Test | Detail | Latency |
|--------|------|--------|---------|
| ❌ FAIL | List Tools | HTTP 500: {'message': 'An internal server error occurred. Please contact support |  |

### Admin

| Status | Test | Detail | Latency |
|--------|------|--------|---------|
| ❌ FAIL | Audit Logs | HTTP 500: {'message': 'An internal server error occurred. Please contact support |  |
| ⚠️  WARN | Admin Circuits | Restricted access (expected) |  |

### Security

| Status | Test | Detail | Latency |
|--------|------|--------|---------|
| ⚠️  WARN | Guardian Validate | Requires auth |  |
| ⏭️  SKIP | Guardian Blocks Malicious | auth required |  |

### Codebase

| Status | Test | Detail | Latency |
|--------|------|--------|---------|
| ✅ PASS | Python Syntax (108 files) |  |  |
| ✅ PASS | Import: FastAPI App |  |  |
| ✅ PASS | Import: API Router |  |  |
| ✅ PASS | Import: Database Module |  |  |
| ✅ PASS | Import: Agent Model |  |  |
| ✅ PASS | Import: User Model |  |  |
| ✅ PASS | Import: Agent Service |  |  |
| ✅ PASS | Import: Task Service |  |  |
| ✅ PASS | Import: Trace Service |  |  |
| ✅ PASS | .env Required Vars |  |  |
| ⚠️  WARN | API Keys Configured | Placeholder API keys detected — agent reasoning will FAIL |  |

### Database

| Status | Test | Detail | Latency |
|--------|------|--------|---------|
| ❌ FAIL | Table: users | Table missing! |  |
| 🔧 FIXED | Auto-fix: create users |  |  |
| ❌ FAIL | Table: agents | Table missing! |  |
| 🔧 FIXED | Auto-fix: create agents |  |  |
| ❌ FAIL | Table: tasks | Table missing! |  |
| 🔧 FIXED | Auto-fix: create tasks |  |  |
| ❌ FAIL | Table: tools | Table missing! |  |
| 🔧 FIXED | Auto-fix: create tools |  |  |
| ❌ FAIL | Table: audit_logs | Table missing! |  |
| 🔧 FIXED | Auto-fix: create audit_logs |  |  |

## 🔧 Fixes Applied

- Flagged table 'users' for creation
- Flagged table 'agents' for creation
- Flagged table 'tasks' for creation
- Flagged table 'tools' for creation
- Flagged table 'audit_logs' for creation

## 🚨 Recommended Actions

1. **Auth → User Registration**: HTTP 500: {'message': 'An internal server error occurred. Please contact support.'}
2. **Auth → User Login (JWT)**: HTTP 500: {'message': 'An internal server error occurred. Please contact support.'}
3. **Agents → Create Agent**: HTTP 401: {'detail': 'Invalid authentication (Token or API Key)'}
4. **Agents → List Agents**: HTTP 500: {'message': 'An internal server error occurred. Please contact support.'}
5. **Agents → Agent Leaderboard**: HTTP 500
6. **Analytics → Analytics Metrics**: HTTP 500: {'message': 'An internal server error occurred. Please contact support.'}
7. **Analytics → Traces List**: HTTP 500: {'message': 'An internal server error occurred. Please contact support.'}
8. **Marketplace → List Templates**: HTTP 500: {'message': 'An internal server error occurred. Please contact support.'}
9. **Marketplace → Featured Agents**: HTTP 500
10. **HITL → List Pending Approvals**: HTTP 500: {'message': 'An internal server error occurred. Please contact support.'}

---
*Report generated by AgentCloud Doctor v1.0 — 51 checks in 2026-03-23T08:16:50.210308 → 2026-03-23T08:16:52.896511*