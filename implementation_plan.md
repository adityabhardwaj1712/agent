# Goal
The goal of this implementation plan is to address the comprehensive issue analysis and feature roadmap provided for the AgentCloud platform. Given the massive scope (40+ bugs, 65+ roadmap features, and a complete UI redesign), this plan focuses on establishing a rock-solid foundation by tackling all **P0 (Critical)** and **P1 (High Priority)** bugs, alongside a select set of initial **Phase 1 Foundation** features to deliver immediate value and stability.

## User Review Required
> [!IMPORTANT]
> Because the provided documents contain over a year's worth of roadmap features and comprehensive bug fixes, it is not realistic to implement all 65+ features in a single pass. 
> 
> I propose breaking this massive request down into iterative stages. **This plan outlines Stage 1**, which covers the highest priority bug fixes and foundational feature extensions. Please let me know if you approve of this scoped approach, or if there are specific P2/P3 bugs or Phase 2/3 features you want prioritized immediately.

## Proposed Changes

### Database & Core Initialization (P0 Bugs)
We need to ensure the system is resilient to missing dependencies and environment issues.

#### [MODIFY] `app/main.py`
- Wrap the `CREATE EXTENSION IF NOT EXISTS vector;` in a `try...except` block so that failure to install `pgvector` does not skip the creation of all other database tables. This directly fixes **BUG-001**.
- Move model imports outside the try block so they are always evaluated and registered for SQLAlchemy metadata generation.

#### [MODIFY] `app/core/logging_config.py`
- Standardize the fallback for `sys.stdout` and `sys.stderr` if they are None (typical in Windows services or Docker without TTY) to fix **BUG-002**.

#### [MODIFY] `app/config.py`
- Implement strong `SECRET_KEY` validation using Pydantic `@field_validator`. If the key is shorter than 32 characters or equals the default "secret-key-change-me", raise an error to prevent server startup with a compromised key. This fixes **BUG-012**.

---
### Worker & Event System Resilience (P0 & P1 Bugs)

#### [MODIFY] `app/workers/agent_worker.py`
- Add signal handlers (SIGINT/SIGTERM) for graceful shutdown, ensuring running tasks are cancelled and Redis event loops are cleanly closed to address **BUG-005**.
- Apply a safer Redis lock implementation to avoid race conditions when picking up tasks from the queue (**BUG-009**).

#### [MODIFY] `app/services/memory_service.py`
- Implement a graceful degradation mechanism for memory search. If vector search fails or `_PGVECTOR_AVAILABLE` is `False`, cleanly fall back to keyword search and return a degraded flag, fixing **BUG-010**.

---
### Frontend Safety & Error Handling (P1 Bugs)

#### [MODIFY] `frontend/app/lib/api.ts` (or create if missing)
- Implement universal `APIError` classes, structured error parsing, and a global timeout wrapper for `fetch` requests to prevent hanging API calls, resolving **BUG-018** and **BUG-019**.

---
### Foundational Features (Phase 1 Roadmap)

#### [MODIFY] `app/core/llm.py`
- Introduce a **Multi-Model Ensemble Framework (FEATURE-018)**. We will add a utility capable of dynamically polling multiple models (e.g. OpenAI, Anthropic, Gemini) and applying strategies such as "voting" or "cascading" to synthesize the final output.

#### [MODIFY] `frontend/app/globals.css`
- Apply the requested **Figma Design System**. Enhance the glassmorphism and military/command-center aesthetic using the specified `cyan/amber` palettes, monospace fonts, and glowing elements.

## Open Questions

> [!WARNING]
> 1. **Data Deletion:** The bug report suggests enforcing rate-limiting (BUG-014) and tightening CORS (BUG-011). Tightening CORS to specific origins might break local development setups depending on your frontend's actual URL. Are we safe to restrict CORS to `http://localhost:3000`?
> 2. **Multi-Tenancy (FEATURE-028):** Adding multi-tenancy involves adding an `organization_id` foreign key to almost every table, rendering existing databases incompatible without heavy migrations. Should we defer this to a later phase to maintain focus on stability first?

## Verification Plan

### Automated Tests
- Run `python scripts/doctor.py --fix` and `python scripts/smoke.py` inside the container boundary.
- Assert that omitting `pgvector` dependencies does not crash `agent-db-1` or `api`.

### Manual Verification
- Access the `frontend` to verify that the newly implemented Military Operations visual scheme is correctly rendered.
- Intentionally provide a weak `SECRET_KEY` in the `.env` file to verify that the `api` service cleanly rejects it at startup with a helpful error.
