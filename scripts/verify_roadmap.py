import asyncio
import json
import uuid
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.database import AsyncSessionLocal
from app.services.trace_service import log_trace, get_trace_analytics
from app.services.approval_service import approval_service
from app.services.tool_executor import ToolExecutor

async def verify():
    print("--- Roadmap Features Verification ---")
    
    async with AsyncSessionLocal() as db:
        # 1. Verify Trace Analytics
        print("\n1. Testing Trace Analytics...")
        task_id = str(uuid.uuid4())
        await log_trace(db, task_id, "test_agent", "thought", {"input": "hallo"}, {"output": "hi"})
        stats = await get_trace_analytics(db)
        print(f"   Recent Trace Stats: {stats}")
        if "thought" in stats:
            print("   ✅ Trace Analytics working.")
        else:
            print("   ❌ Trace Analytics failed.")

        # 2. Verify HITL Interception
        print("\n2. Testing HITL Interception...")
        # shell_execute is sensitive
        context = {"db": db, "task_id": task_id, "agent_id": "test_agent"}
        res_json = await ToolExecutor.execute("shell_execute", json.dumps({"command": "ls"}), context=context)
        res = json.loads(res_json)
        print(f"   Tool Result: {res}")
        if res.get("status") == "pending_approval":
            print("   ✅ HITL Interception working.")
        else:
            print("   ❌ HITL Interception failed.")

        # 3. Verify Approval Request Creation
        print("\n3. Testing Approval Service...")
        pending = await approval_service.list_pending(db)
        print(f"   Pending Requests Count: {len(pending)}")
        if len(pending) > 0:
            print("   ✅ Approval Service working.")
        else:
            print("   ❌ Approval Service failed.")

    print("\n--- Verification Complete ---")

if __name__ == "__main__":
    asyncio.run(verify())
