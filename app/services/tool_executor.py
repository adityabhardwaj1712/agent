from __future__ import annotations

import json
import logging
import os
from typing import Any, Callable, Dict, Optional

import httpx

logger = logging.getLogger(__name__)


class ToolExecutor:
    """AXON Execution Engine ? real implementations, real results."""

    _registry: Dict[str, Callable] = {}
    SENSITIVE_TOOLS = ["shell_execute", "github_create_issue", "slack_message", "python_interpreter"]

    @classmethod
    def register(cls, name: str):
        def decorator(func: Callable):
            cls._registry[name] = func
            return func
        return decorator

    @classmethod
    async def execute(cls, tool_name: str, arguments_json: str, context: dict | None = None) -> str:
        """
        Executes a tool. If the tool is sensitive and a database context is provided,
        it creates a pending approval request instead of executing.
        """
        try:
            args = json.loads(arguments_json) if arguments_json else {}
        except json.JSONDecodeError:
            args = {}

        handler = cls._registry.get(tool_name)
        if not handler:
            return json.dumps({"error": f"Tool '{tool_name}' not registered. Available: {list(cls._registry)}"})

        # HITL Integration: Check if tool requires approval
        if tool_name in cls.SENSITIVE_TOOLS and context and "db" in context:
            db = context["db"]
            task_id = context.get("task_id")
            agent_id = context.get("agent_id")
            
            from .approval_service import approval_service
            logger.warning(f"HITL REQUIRED for sensitive tool: {tool_name}")
            await approval_service.create_request(
                db=db,
                task_id=task_id,
                agent_id=agent_id,
                operation=tool_name,
                payload=arguments_json
            )
            return json.dumps({
                "status": "pending_approval",
                "message": f"Tool '{tool_name}' requires human approval before execution.",
                "request_id": task_id # Using task_id as a hint for the UI to find the request
            })

        logger.info(f"Executing tool: {tool_name} args={list(args)[:5]}")
        
        # ENTERPRISE AUDIT
        from .audit_service import audit_service
        await audit_service.log_action(
            user_id=context.get("user_id", "unknown") if context else "unknown",
            action_type="tool_execution",
            agent_id=context.get("agent_id") if context else None,
            task_id=context.get("task_id") if context else None,
            detail={"tool": tool_name, "args_preview": list(args)[:5]}
        )
        try:
            result = await handler(**args)
            return json.dumps({
                "status": "success",
                "tool": tool_name,
                "result": result
            })
        except Exception as exc:
            logger.error(f"Tool '{tool_name}' raised: {exc}")
            return json.dumps({
                "status": "error",
                "tool": tool_name,
                "error": str(exc),
                "message": f"Execution of {tool_name} failed in sandbox."
            })


# --- 1. Web Search (Serper.dev) ----------------------------------------------

@ToolExecutor.register("google_search")
async def google_search(query: str, num_results: int = 5) -> dict:
    """
    Real web search via Serper.dev.  Free tier: 2 500 queries/month.
    Requires SERPER_API_KEY in environment.
    """
    api_key = os.getenv("SERPER_API_KEY")
    if not api_key:
        return {"error": "SERPER_API_KEY not set. Get a free key at serper.dev"}

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
            json={"q": query, "num": num_results},
        )
        response.raise_for_status()
        data = response.json()

    results = []
    for item in data.get("organic", [])[:num_results]:
        results.append({
            "title": item.get("title"),
            "snippet": item.get("snippet"),
            "url": item.get("link"),
        })

    answer_box = data.get("answerBox", {})
    return {
        "query": query,
        "answer": answer_box.get("answer") or answer_box.get("snippet"),
        "results": results,
    }


# --- 1.5. Web Search (Free DuckDuckGo/Google Wrapper) -----------------------

@ToolExecutor.register("web_search")
async def web_search(query: str, num_results: int = 5) -> dict:
    """
    Search the web for information.
    Automatically uses Serper API if available, otherwise falls back to a free DuckDuckGo search.
    """
    # Try Google Search first if key exists
    if os.getenv("SERPER_API_KEY"):
        return await google_search(query, num_results)
    
    # Fallback to free DuckDuckGo HTML scraping
    try:
        async with httpx.AsyncClient(
            timeout=15.0,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        ) as client:
            resp = await client.post(
                "https://html.duckduckgo.com/html/", 
                data={"q": query}
            )
            resp.raise_for_status()
            
        import re
        results = []
        html = resp.text
        # Simple regex to extract results from DuckDuckGo HTML
        snippets = re.finditer(r'<a class="result__snippet[^>]+href="([^"]+)"[^>]*>(.*?)</a>', html, re.DOTALL | re.IGNORECASE)
        titles = re.finditer(r'<h2 class="result__title">.*?<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', html, re.DOTALL | re.IGNORECASE)
        
        # It's an imperfect regex scrape, but works well enough as a free no-key fallback
        for s_match, t_match in zip(snippets, titles):
            if len(results) >= num_results:
                break
            url = s_match.group(1).lstrip('/url?q=') # DDG sometimes wraps the urls
            if '&' in url:
                url = url.split('&')[0]
            
            import urllib.parse
            url = urllib.parse.unquote(url)
                
            title = re.sub(r'<[^>]+>', '', t_match.group(2)).strip()
            snippet = re.sub(r'<[^>]+>', '', s_match.group(2)).strip()
            results.append({"title": title, "url": url, "snippet": snippet})
            
        if not results:
            return {"query": query, "results": [], "error": "No results found."}
            
        return {"query": query, "results": results}
    except Exception as e:
        return {"error": f"Web search failed: {str(e)}", "query": query}


# --- 2. Web Fetch ------------------------------------------------------------

@ToolExecutor.register("web_fetch")
async def web_fetch(url: str, max_chars: int = 4000) -> dict:
    """Fetches a URL and returns its text content (up to max_chars)."""
    async with httpx.AsyncClient(
        timeout=20.0,
        follow_redirects=True,
        headers={"User-Agent": "AgentCloud/1.0 (autonomous research agent)"},
    ) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "")

    if "html" in content_type:
        # Very lightweight HTML ? text stripping (no BeautifulSoup dependency)
        import re
        text = re.sub(r"<script[^>]*>.*?</script>", "", resp.text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"<style[^>]*>.*?</style>", "", text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
    else:
        text = resp.text

    return {"url": url, "content": text[:max_chars], "truncated": len(text) > max_chars}


# --- 3. Python Interpreter (E2B cloud sandbox) -------------------------------

@ToolExecutor.register("python_interpreter")
async def python_interpreter(code: str, timeout: int = 30) -> dict:
    """
    Executes Python in an E2B cloud sandbox (https://e2b.dev).
    Requires E2B_API_KEY in environment.  Free tier available.
    """
    api_key = os.getenv("E2B_API_KEY")
    if not api_key:
        return {"error": "E2B_API_KEY not set. Get a free key at e2b.dev", "code": code}

    try:
        from e2b_code_interpreter import CodeInterpreter  # pip install e2b-code-interpreter
    except ImportError:
        return {"error": "e2b-code-interpreter not installed. Run: pip install e2b-code-interpreter"}

    import asyncio, functools
    loop = asyncio.get_event_loop()

    def _run():
        with CodeInterpreter(api_key=api_key, timeout=timeout) as sb:
            execution = sb.notebook.exec_cell(code)
            stdout = "\n".join(r.text for r in execution.results if hasattr(r, "text") and r.text)
            logs = (execution.logs.stdout or []) + (execution.logs.stderr or [])
            return {
                "stdout": stdout or "\n".join(logs),
                "error": str(execution.error) if execution.error else None,
                "code": code,
            }

    return await loop.run_in_executor(None, _run)


# --- 4. Shell Execute (E2B sandbox) -----------------------------------------

@ToolExecutor.register("shell_execute")
async def shell_execute(command: str, timeout: int = 30) -> dict:
    """
    Runs a shell command inside an E2B sandbox (isolated, safe).
    Requires E2B_API_KEY.
    """
    api_key = os.getenv("E2B_API_KEY")
    if not api_key:
        return {"error": "E2B_API_KEY not set. Requires e2b.dev account."}

    try:
        from e2b_code_interpreter import CodeInterpreter
    except ImportError:
        return {"error": "e2b-code-interpreter not installed."}

    import asyncio

    def _run():
        with CodeInterpreter(api_key=api_key, timeout=timeout) as sb:
            result = sb.process.start_and_wait(command, timeout=timeout)
            return {
                "command": command,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "exit_code": result.exit_code,
            }

    return await asyncio.get_event_loop().run_in_executor(None, _run)


# --- 5. GitHub ? create issue ------------------------------------------------

@ToolExecutor.register("github_create_issue")
async def github_create_issue(repo: str, title: str, body: str, labels: list = None) -> dict:
    """
    Creates a real GitHub issue using GITHUB_ACCESS_TOKEN.
    repo format: 'owner/repo-name'
    """
    token = os.getenv("GITHUB_ACCESS_TOKEN")
    if not token:
        return {"error": "GITHUB_ACCESS_TOKEN not set."}

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"https://api.github.com/repos/{repo}/issues",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            json={"title": title, "body": body, "labels": labels or []},
        )
        resp.raise_for_status()
        data = resp.json()

    return {"status": "created", "issue_number": data["number"], "url": data["html_url"]}


# --- 6. GitHub ? search code -------------------------------------------------

@ToolExecutor.register("github_search_code")
async def github_search_code(query: str, language: Optional[str] = None, limit: int = 5) -> dict:
    token = os.getenv("GITHUB_ACCESS_TOKEN")
    q = query + (f" language:{language}" if language else "")
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            "https://api.github.com/search/code",
            headers=headers,
            params={"q": q, "per_page": limit},
        )
        resp.raise_for_status()
        data = resp.json()

    items = [
        {"repo": i["repository"]["full_name"], "path": i["path"], "url": i["html_url"]}
        for i in data.get("items", [])
    ]
    return {"query": q, "total": data.get("total_count"), "results": items}


# --- 7. Send Slack message ---------------------------------------------------

@ToolExecutor.register("slack_message")
async def slack_message(channel: str, text: str) -> dict:
    """Sends a Slack message via the existing SlackService."""
    from ..services.slack_service import slack_service
    await slack_service.send_notification(f"*[Agent Tool]* #{channel}: {text}")
    return {"status": "sent", "channel": channel}


# --- 8. Calculator (safe eval) -----------------------------------------------

@ToolExecutor.register("calculate")
async def calculate(expression: str) -> dict:
    """Safely evaluates a mathematical expression."""
    import ast, operator as op

    _ops = {
        ast.Add: op.add, ast.Sub: op.sub, ast.Mult: op.mul,
        ast.Div: op.truediv, ast.Pow: op.pow, ast.USub: op.neg,
    }

    def _eval(node):
        if isinstance(node, ast.Constant):
            return node.value
        elif isinstance(node, ast.BinOp):
            return _ops[type(node.op)](_eval(node.left), _eval(node.right))
        elif isinstance(node, ast.UnaryOp):
            return _ops[type(node.op)](_eval(node.operand))
        raise ValueError(f"Unsupported: {node}")

    try:
        tree = ast.parse(expression, mode="eval")
        result = _eval(tree.body)
        return {"expression": expression, "result": result}
    except Exception as exc:
        return {"error": str(exc), "expression": expression}

# --- 9. Local Python Sandbox -----------------------------------------------

@ToolExecutor.register("run_python")
async def run_python(code: str) -> dict:
    """Executes Python code locally in a subprocess sandbox with a 10s timeout."""
    import asyncio
    import sys
    
    try:
        proc = await asyncio.create_subprocess_exec(
            sys.executable, "-c", code,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=10.0)
            return {"output": stdout.decode(), "error": stderr.decode()}
        except asyncio.TimeoutError:
            proc.kill()
            await proc.communicate()
            return {"error": "Execution timed out after 10 seconds. Script killed.", "code": code}
            
    except Exception as e:
        return {"error": str(e), "code": code}

