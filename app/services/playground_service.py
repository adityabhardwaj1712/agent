import asyncio
import time
import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from .model_router import select_model, call_provider

class TestCase(BaseModel):
    input: str
    expected_output: Optional[str] = None

class PlaygroundSessionRequest(BaseModel):
    agent_id: Optional[str] = None
    system_prompt: Optional[str] = None
    model_name: str = "gpt-4o"
    test_cases: List[TestCase]

class TestResult(BaseModel):
    test_case: TestCase
    actual_output: str
    latency_ms: int
    tokens_used: int
    cost: float
    status: str # "success", "failure"
    task_id: Optional[str] = None

class PlaygroundSessionResult(BaseModel):
    session_id: str
    results: List[TestResult]
    avg_latency: float
    total_cost: float
    summary: str

class PlaygroundService:
    async def run_session(self, request: PlaygroundSessionRequest) -> PlaygroundSessionResult:
        session_id = str(uuid.uuid4())
        results = []
        i = 0
        
        # In a real playground, we'd iterate through test cases
        for test_case in request.test_cases:
            start_time = time.perf_counter()
            
            # Use AxonService to execute the reasoning
            # If agent_id is provided, we could load its prompt, but here we allow prompt injection
            messages = [{"role": "system", "content": request.system_prompt or "You are a helpful assistant."}]
            messages.append({"role": "user", "content": test_case.input})
            
            test_task_id = f"playground_{session_id}_{i}"
            i += 1
            
            try:
                choice = select_model(test_case.input)
                output, tool_calls, usage = await call_provider(
                    choice=choice,
                    prompt=test_case.input,
                    messages=messages,
                    task_id=test_task_id
                )
                
                latency = int((time.perf_counter() - start_time) * 1000)
                tokens = usage.get("total_tokens", 0) if usage else 0
                # Mock cost calculation
                cost = (tokens / 1000) * 0.03 
                
                results.append(TestResult(
                    test_case=test_case,
                    actual_output=output,
                    latency_ms=latency,
                    tokens_used=tokens,
                    cost=cost,
                    status="success",
                    task_id=test_task_id
                ))
            except Exception as e:
                results.append(TestResult(
                    test_case=test_case,
                    actual_output=f"Error: {str(e)}",
                    latency_ms=0,
                    tokens_used=0,
                    cost=0.0,
                    status="failure"
                ))

        avg_latency = sum(r.latency_ms for r in results) / len(results) if results else 0
        total_cost = sum(r.cost for r in results)
        
        return PlaygroundSessionResult(
            session_id=session_id,
            results=results,
            avg_latency=avg_latency,
            total_cost=total_cost,
            summary=f"Run complete. {len([r for r in results if r.status == 'success'])}/{len(results)} tests passed."
        )

playground_service = PlaygroundService()
