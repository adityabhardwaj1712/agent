# AgentCloud Enterprise OS — Tactical Operations Manual

> [!IMPORTANT]
> **ACCESS RESTRICTED**: This document is for Mission Commanders and Platform Administrators only. 
> AgentCloud is now running on the **Enterprise Swarm Intelligence** architecture (v6.0.0-PRO).

---

## 🛰️ 1. Unified Mission Control (The Dashboard)
The primary interface for monitoring the decentralized fleet.

- **Neural Mesh Telemetry**: Real-time visualization of agent-to-agent communication and data packet transit.
- **ThoughtStream Hub**: Filterable interaction monitoring. Use these filters to isolate logic errors or search latency:
  * `LOGIC`: Trace decision-making in RouterNodes.
  * `REVIEW`: Monitor autonomous Critic peer-review loops.
  * `DATA`: Observe high-dimensionality memory retrieval.
- **LLMOps Command Hub**: Direct oversight of API spend. Track **Tokens-per-Mission** and **Model Performance** (P95 Latency).

---

## 🧠 2. Swarm Intelligence & Peer-Review
AgentCloud uses a decentralized "Critic" protocol to ensure mission success.

- **Strategists**: High-reasoning agents (Llama 3 70B / GPT-4o) tasked with DAG decomposition.
- **Researchers**: Cost-efficient agents (Gemma 3 4B) for high-volume data retrieval.
- **Critics**: Autonomous evaluators that perform cross-validation. If a Researcher's output is flagged, the Critic will automatically trigger a **Refinement Loop** back to the Researcher.

---

## 🎨 3. Visual Workflow Studio
Design mission-critical workflows using the interactive canvas.

- **Agent Nodes**: Neural link points for persona-based execution.
- **Router Nodes**: Dynamic branching points (IF/ELSE) based on previous task output.
- **Tool Nodes**: Registered sandboxed environments for code execution and search.
- **Persistence**: Workflows are saved to the backend mission registry and can be re-launched with one click.

---

## 🛡️ 4. Enterprise Security & Hardening
Harden your deployment with the built-in RBAC and Health systems.

- **RBAC**: Role-Based Access Control is enforced on all destructive actions. 
  * `ADMIN`: Full fleet decommissioning capabilities.
  * `ORCHESTRATOR`: Design and launch mission DAGs.
  * `ANALYST`: View telemetry and generate reports.
- **Fleet Health**: The `/api/v1/health` endpoint provides real-time diagnostic telemetry for Postgres, Redis, and the Vector Mesh.
- **LLMOps Auditing**: All token usage is logged with millisecond precision to the `traces` audit log.

---

## 🛠️ 5. Deployment Quickstart
To scale the fleet for enterprise payloads:

```bash
# Launch production cluster with 3x Worker Replicas
docker-compose -f docker-compose.prod.yml up -d --scale agent-worker=3
```

---

**AgentCloud Enterprise OS**
*Forging the future of decentralized autonomous intelligence.*
