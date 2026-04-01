import asyncio
import logging
from typing import Dict, List, Any, Optional, Set, Callable
from datetime import datetime, timezone
import uuid

# Remove circular import
# from .autonomous_orchestrator import AutonomousOrchestrator
from ..models.task import Task
from ..db.database import AsyncSessionLocal
from sqlalchemy import select

logger = logging.getLogger(__name__)

class DAGNode:
    def __init__(self, id: str, description: str, node_type: str = "agentNode", agent_id: Optional[str] = None):
        self.id = id
        self.description = description
        self.node_type = node_type
        self.agent_id = agent_id
        self.dependencies: Set[str] = set()
        self.status = "pending" # pending, running, completed, failed
        self.result: Optional[str] = None
        self.error: Optional[str] = None
        self.started_at: Optional[datetime] = None
        self.finished_at: Optional[datetime] = None

class DAGEngine:
    """
    Manages the execution of Directed Acyclic Graph (DAG) workflows.
    Supports parallel execution of independent nodes.
    """

    def __init__(self):
        self.execute_fn: Optional[Callable] = None

    async def execute_workflow(self, goal_id: str, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]], execute_fn: Callable):
        """
        Executes a workflow defined by nodes and edges.
        """
        self.execute_fn = execute_fn
        
        # 0. Cycle Detection (Topological Sort / DFS)
        if self._has_cycle(nodes, edges):
            logger.error(f"Workflow {goal_id} aborted: Cycle detected in DAG")
            return {n["id"]: {"status": "failed", "error": "DAG Cycle Detected"} for n in nodes}

        # 1. Build the graph
        graph: Dict[str, DAGNode] = {}

        for n in nodes:
            node = DAGNode(
                id=n["id"], 
                description=n.get("description") or n.get("data", {}).get("label") or "", 
                node_type=n.get("type", "agentNode"),
                agent_id=n.get("agent_id")
            )
            graph[n["id"]] = node

        for e in edges:
            source = e["source"]
            target = e["target"]
            if target in graph:
                graph[target].dependencies.add(source)

        # 2. Execution Loop
        completed_nodes: Set[str] = set()
        running_tasks: Dict[str, asyncio.Task] = {}

        logger.info(f"Starting DAG workflow for goal {goal_id} with {len(nodes)} nodes")

        while len(completed_nodes) < len(graph):
            # Find nodes ready to run (all dependencies completed OR router decision)
            ready_nodes = []
            for node_id, node in graph.items():
                if node_id in completed_nodes or node_id in running_tasks:
                    continue
                
                # Check siblings for router decision
                # If any dependency is a router, we only run if the router chose this path
                # (Simplified: For now, if all dependencies are 'completed', we are ready)
                if all(dep in completed_nodes for dep in node.dependencies) and node.status != "failed":
                    ready_nodes.append(node_id)

            # Start ready nodes
            for node_id in ready_nodes:
                node = graph[node_id]
                node.status = "running"
                node.started_at = datetime.now(timezone.utc)
                
                # Start execution as a background task
                task = asyncio.create_task(self._execute_node(goal_id, node, graph))
                running_tasks[node_id] = task
                logger.debug(f"Started node {node_id}: {node.description}")

            if not running_tasks:
                if len(completed_nodes) < len(graph):
                    # Check for deadlocks or failed dependencies
                    failed_nodes = [id for id, n in graph.items() if n.status == "failed"]
                    if failed_nodes:
                        logger.error(f"Workflow {goal_id} aborted due to failed nodes: {failed_nodes}")
                        break
                    
                    # Special case: Router might have skipped nodes
                    break
                break

            # Wait for any task to complete
            done, _ = await asyncio.wait(running_tasks.values(), return_when=asyncio.FIRST_COMPLETED)
            
            # Process completed tasks
            for task in done:
                finished_node_id = None
                for node_id, t in running_tasks.items():
                    if t == task:
                        finished_node_id = node_id
                        break
                
                if finished_node_id:
                    del running_tasks[finished_node_id]
                    completed_nodes.add(finished_node_id)
                    logger.debug(f"Completed node {finished_node_id}")

        logger.info(f"Workflow {goal_id} finished. {len(completed_nodes)}/{len(graph)} nodes completed.")
        return {node_id: {"status": n.status, "result": n.result, "error": n.error} for node_id, n in graph.items()}

    async def _execute_node(self, goal_id: str, node: DAGNode, graph: Dict[str, DAGNode]):
        """
        Executes a single node in the DAG.
        """
        try:
            logger.info(f"Executing node {node.id} [{node.node_type}]: {node.description}")
            
            # ROUTER LOGIC
            if node.node_type == "routerNode":
                 # Get prev result
                 prev_result = ""
                 if node.dependencies:
                     dep_id = list(node.dependencies)[0]
                     prev_result = str(graph[dep_id].result or "").lower()
                 
                 # Simple condition: If description matches keyword
                 # e.g. "if error"
                 node.result = "proceed" if "error" not in prev_result else "abort"
                 node.status = "completed"
                 node.finished_at = datetime.now(timezone.utc)
                 return

            # AGENT/TOOL LOGIC
            description = node.description
            if "{prev_output}" in description and node.dependencies:
                dep_id = list(node.dependencies)[0]
                prev_result = graph[dep_id].result or ""
                description = description.replace("{prev_output}", str(prev_result))
            
            # Use the passed execution function
            assert self.execute_fn is not None
            result = await self.execute_fn(description)
            
            node.result = result
            node.status = "completed"
            node.finished_at = datetime.now(timezone.utc)
            
        except Exception as e:
            logger.error(f"Error executing node {node.id}: {e}")
            node.error = str(e)
            node.status = "failed"
            node.finished_at = datetime.now(timezone.utc)

    def _has_cycle(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> bool:
        """
        DFS-based cycle detection (White/Gray/Black coloring).
        """
        adj = {n["id"]: [] for n in nodes}
        for e in edges:
            if e["source"] in adj and e["target"] in adj:
                adj[e["source"]].append(e["target"])
                
        visited: Set[str] = set()
        rec_stack: Set[str] = set()

        def dfs(u: str) -> bool:
            visited.add(u)
            rec_stack.add(u)
            for v in adj.get(u, []):
                if v not in visited:
                    if dfs(v): return True
                elif v in rec_stack:
                    return True
            rec_stack.remove(u)
            return False

        for node_id in adj:
            if node_id not in visited:
                if dfs(node_id): return True
        return False

dag_engine = DAGEngine()

