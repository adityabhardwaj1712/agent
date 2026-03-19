"""
UPGRADE 1: DAG Workflow Engine  (app/services/dag_engine.py)
"""
from __future__ import annotations

import asyncio
import json
import uuid
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.database import AsyncSessionLocal
from ..models.task import Task
from ..services.model_router import select_model, call_provider


# ─── Data classes ─────────────────────────────────────────────────────────────

@dataclass
class Node:
    """A single step in the workflow."""
    node_id: str
    agent_id: str
    instruction: str                        # May reference {state_key} for templating
    timeout_seconds: int = 120
    max_retries: int = 2
    # If set, this node's output key is used to pick the next edge
    condition: Optional[Callable[[dict], str]] = None


@dataclass
class Edge:
    """A directed connection from one node to another."""
    from_node: str
    to_node: str
    condition_value: Optional[str] = None   # Only follow if node's condition() == this


@dataclass
class WorkflowDef:
    """Complete workflow definition."""
    name: str
    nodes: List[Node]
    edges: List[Edge]
    parallel_groups: List[List[str]] = field(default_factory=list)  # node_ids to run in parallel
    entry_node: Optional[str] = None        # defaults to first node


@dataclass
class NodeResult:
    node_id: str
    status: str                             # "completed" | "failed" | "skipped"
    output: str = ""
    duration_ms: int = 0
    error: Optional[str] = None


@dataclass
class WorkflowResult:
    workflow_id: str
    workflow_name: str
    status: str                             # "completed" | "failed" | "partial"
    final_state: Dict[str, Any]
    node_results: List[NodeResult]
    total_duration_ms: int
    error: Optional[str] = None


# ─── Engine ───────────────────────────────────────────────────────────────────

class WorkflowEngine:
    def __init__(self):
        self._node_map: Dict[str, Node] = {}
        self._edge_map: Dict[str, List[Edge]] = {}

    def _build_maps(self, wf: WorkflowDef):
        self._node_map = {n.node_id: n for n in wf.nodes}
        self._edge_map = {}
        for edge in wf.edges:
            self._edge_map.setdefault(edge.from_node, []).append(edge)

    async def run(
        self,
        wf: WorkflowDef,
        initial_state: Dict[str, Any],
        user_id: str,
        resume_from: Optional[str] = None,   # node_id to resume from after failure
    ) -> WorkflowResult:
        workflow_id = str(uuid.uuid4())
        start = time.monotonic()
        self._build_maps(wf)

        state = dict(initial_state)
        node_results: List[NodeResult] = []
        current_node_id = resume_from or wf.entry_node or wf.nodes[0].node_id

        logger.info(f"Workflow {wf.name} [{workflow_id}] starting at node={current_node_id}")

        parallel_set: set[str] = {nid for group in wf.parallel_groups for nid in group}

        try:
            while current_node_id and current_node_id != "__end__":
                node = self._node_map.get(current_node_id)
                if not node:
                    raise ValueError(f"Node '{current_node_id}' not found in workflow '{wf.name}'")

                # ── Parallel group? ───────────────────────────────────────────
                parallel_group = next(
                    (g for g in wf.parallel_groups if current_node_id in g), None
                )
                if parallel_group:
                    group_results = await self._run_parallel(parallel_group, state, user_id)
                    node_results.extend(group_results)
                    for r in group_results:
                        state[f"{r.node_id}_result"] = r.output
                    # Move past the group — find edge from last node in group
                    last_node_id = parallel_group[-1]
                    current_node_id = self._next_node(last_node_id, state)
                else:
                    # ── Single node ───────────────────────────────────────────
                    result = await self._run_node(node, state, user_id)
                    node_results.append(result)

                    if result.status == "failed":
                        return WorkflowResult(
                            workflow_id=workflow_id,
                            workflow_name=wf.name,
                            status="failed",
                            final_state=state,
                            node_results=node_results,
                            total_duration_ms=int((time.monotonic() - start) * 1000),
                            error=result.error,
                        )

                    state[f"{node.node_id}_result"] = result.output
                    current_node_id = self._next_node(current_node_id, state, node)

            total_ms = int((time.monotonic() - start) * 1000)
            logger.info(f"Workflow {wf.name} [{workflow_id}] completed in {total_ms}ms")

            return WorkflowResult(
                workflow_id=workflow_id,
                workflow_name=wf.name,
                status="completed",
                final_state=state,
                node_results=node_results,
                total_duration_ms=total_ms,
            )

        except Exception as exc:
            logger.error(f"Workflow {wf.name} [{workflow_id}] crashed: {exc}")
            return WorkflowResult(
                workflow_id=workflow_id,
                workflow_name=wf.name,
                status="failed",
                final_state=state,
                node_results=node_results,
                total_duration_ms=int((time.monotonic() - start) * 1000),
                error=str(exc),
            )

    async def _run_node(self, node: Node, state: dict, user_id: str) -> NodeResult:
        """Execute a single node with retry logic."""
        t0 = time.monotonic()
        instruction = node.instruction.format_map(state)   # fill {state_key} references

        for attempt in range(node.max_retries + 1):
            try:
                model = select_model(instruction)
                messages = [
                    {"role": "system", "content": (
                        "You are an autonomous agent executing one step of a multi-step workflow. "
                        "Complete only the task given. Be concise and structured."
                    )},
                    {"role": "user", "content": instruction},
                ]
                content, _, _usage = await asyncio.wait_for(
                    call_provider(model, messages=messages),
                    timeout=node.timeout_seconds,
                )
                duration_ms = int((time.monotonic() - t0) * 1000)
                logger.info(f"Node '{node.node_id}' completed in {duration_ms}ms")
                return NodeResult(
                    node_id=node.node_id,
                    status="completed",
                    output=content or "",
                    duration_ms=duration_ms,
                )
            except asyncio.TimeoutError:
                logger.warning(f"Node '{node.node_id}' timed out (attempt {attempt+1})")
                if attempt == node.max_retries:
                    return NodeResult(
                        node_id=node.node_id,
                        status="failed",
                        duration_ms=int((time.monotonic() - t0) * 1000),
                        error=f"Timeout after {node.timeout_seconds}s",
                    )
                await asyncio.sleep(2 ** attempt * 3)
            except Exception as exc:
                logger.error(f"Node '{node.node_id}' error: {exc}")
                if attempt == node.max_retries:
                    return NodeResult(
                        node_id=node.node_id,
                        status="failed",
                        duration_ms=int((time.monotonic() - t0) * 1000),
                        error=str(exc),
                    )
                await asyncio.sleep(2 ** attempt * 3)

    async def _run_parallel(
        self, group: List[str], state: dict, user_id: str
    ) -> List[NodeResult]:
        """Run a group of nodes concurrently and collect results."""
        tasks = [
            self._run_node(self._node_map[nid], state, user_id)
            for nid in group
            if nid in self._node_map
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        out = []
        for r in results:
            if isinstance(r, Exception):
                out.append(NodeResult(node_id="unknown", status="failed", error=str(r)))
            else:
                out.append(r)
        return out

    def _next_node(
        self, current: str, state: dict, node: Optional[Node] = None
    ) -> Optional[str]:
        """Determine the next node based on edges and optional condition."""
        edges = self._edge_map.get(current, [])
        if not edges:
            return "__end__"

        # If node has a condition function, evaluate it
        if node and node.condition:
            condition_result = node.condition(state)
            for edge in edges:
                if edge.condition_value == condition_result:
                    return edge.to_node
            # No matching condition edge — end
            return "__end__"

        # Simple unconditional edge (take first)
        return edges[0].to_node
