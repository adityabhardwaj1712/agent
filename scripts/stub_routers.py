import os

routes = {
    "traces": ["/"],
    "marketplace": ["/templates", "/featured"],
    "workflows": ["/run"],
    "goals": ["/"],
    "approvals": ["/"],
    "tools": ["/"],
    "audit": ["/logs"],
    "admin": ["/circuits"],
    "analytics": ["/metrics", "/"],
    "billing": ["/subscription", "/usage"]
}

for name, paths in routes.items():
    p = f"app/api/v1/{name}.py"
    with open(p, "w") as f:
        f.write("from fastapi import APIRouter\n\nrouter = APIRouter()\n")
        f.write("from typing import Any\n")
        f.write("from pydantic import BaseModel\n\n")
        f.write("class DummyReq(BaseModel):\n    pass\n\n")
        for path in paths:
            method = "post" if "run" in path else "get"
            func_name = path.strip("/").replace("-", "_") or f"list_{name}"
            f.write(f"@router.{method}(\"{path}\")\n")
            if method == "post":
                f.write(f"async def {func_name}(req: dict = None):\n")
            else:
                f.write(f"async def {func_name}():\n")
            f.write("    return []\n\n")
