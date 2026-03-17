import logging
import json
from typing import Dict, Any, Callable

logger = logging.getLogger(__name__)

class ToolExecutor:
    """
    AXON Execution Engine: Dispatches tool calls to real Python functions.
    """
    
    _registry: Dict[str, Callable] = {}

    @classmethod
    def register(cls, name: str):
        def decorator(func: Callable):
            cls._registry[name] = func
            return func
        return decorator

    @classmethod
    async def execute(cls, tool_name: str, arguments_json: str) -> str:
        try:
            args = json.loads(arguments_json)
            handler = cls._registry.get(tool_name)
            
            if not handler:
                return f"Error: Tool '{tool_name}' not found in registry."
            
            logger.info(f"AXON Executing Tool: {tool_name} with args: {args}")
            result = await handler(**args)
            return json.dumps(result)
            
        except Exception as e:
            logger.error(f"Tool execution failed ({tool_name}): {e}")
            return f"Error executing tool {tool_name}: {str(e)}"

# --- TOOL IMPLEMENTATIONS ---

@ToolExecutor.register("google_search")
async def google_search(query: str):
    """Simulated Google Search (Stub for Phase 13)"""
    return {
        "results": [
            {"title": f"Search result for {query}", "snippet": "Showing simulated search data...", "link": "https://google.com"}
        ]
    }

@ToolExecutor.register("github_create_issue")
async def github_create_issue(repo: str, title: str, body: str):
    """Simulated GitHub Integration (Stub for Phase 13)"""
    return {"status": "success", "issue_url": f"https://github.com/{repo}/issues/1"}

@ToolExecutor.register("python_interpreter")
async def python_interpreter(code: str):
    """Execution of Python code in a simulated sandbox."""
    return {"status": "success", "output": f"Simulated output of: {code[:50]}..."}

@ToolExecutor.register("shell_execute")
async def shell_execute(command: str):
    """Simulated execution of local shell commands."""
    return {
        "status": "success", 
        "command": command, 
        "output": f"Simulated execution of '{command}'. In production, this runs in a restricted pod."
    }

@ToolExecutor.register("external_api_call")
async def external_api_call(url: str, method: str = "GET", payload: Optional[dict] = None):
    """Simulated call to arbitrary external APIs."""
    return {
        "status": "success",
        "url": url,
        "method": method,
        "response": {"data": f"Simulated response from {url}"}
    }
