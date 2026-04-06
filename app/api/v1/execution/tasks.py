from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.database import get_db
from app.services import task_service
from app.schemas.task_schema import TaskCreate, TaskResponse, TaskStatusResponse, GoalCreate, GoalResponse
from app.api.deps import get_current_user
from app.models.user import User
import asyncio

router = APIRouter()

@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await task_service.list_tasks(db, user_id=current_user.user_id, skip=skip, limit=limit)

@router.post("/", response_model=TaskResponse)
async def create_task(
    task: TaskCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.services.event_bus import event_bus
    result = await task_service.send_task(db, task, user_id=current_user.user_id)
    await event_bus.publish("task_created", {"type": "task", "task_id": result.task_id})
    return result

@router.get("/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await task_service.get_task_status(db, task_id, user_id=current_user.user_id)

@router.post("/{task_id}/cancel")
async def cancel_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = await task_service.cancel_task(db, task_id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Task cannot be cancelled or not found")
    return {"message": "Task cancelled successfully"}

@router.get("/{task_id}/stream")
async def stream_task_output(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi.responses import StreamingResponse
    from app.db.redis_client import get_async_redis_client
    import json
    
    redis = await get_async_redis_client()
    pubsub = redis.pubsub()
    await pubsub.subscribe(f"task_stream:{task_id}")
    await pubsub.subscribe(f"task_status:{task_id}")
    await pubsub.subscribe(f"task_traces:{task_id}")
    
    async def event_generator():
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    channel = message["channel"].decode() if isinstance(message["channel"], bytes) else message["channel"]
                    data = message["data"].decode() if isinstance(message["data"], bytes) else message["data"]
                    
                    if channel == f"task_stream:{task_id}":
                        try:
                            parsed = json.loads(data)
                            chunk = parsed.get("chunk", "")
                            sse_data = json.dumps({"type": "token", "token": chunk, "done": False})
                            yield f"data: {sse_data}\n\n"
                        except:
                            pass
                    elif channel == f"task_traces:{task_id}":
                        try:
                            # Stream raw trace steps (Mission Timeline)
                            sse_data = json.dumps({"type": "step", "data": json.loads(data), "done": False})
                            yield f"data: {sse_data}\n\n"
                        except:
                            pass
                    elif channel == f"task_status:{task_id}":
                        try:
                            parsed = json.loads(data)
                            if parsed.get("status") in ["completed", "failed"]:
                                sse_data = json.dumps({"type": "status", "status": parsed.get("status"), "done": True})
                                yield f"data: {sse_data}\n\n"
                                break
                        except:
                            pass
        except asyncio.CancelledError:
            pass
        finally:
            await pubsub.close()
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

from pydantic import BaseModel
class RootCauseResponse(BaseModel):
    analysis: str
    fix_suggestion: str

@router.get("/{task_id}/root-cause", response_model=RootCauseResponse)
async def analyze_task_failure(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.services.trace_service import get_traces_for_task
    from app.services.model_router import select_model, call_provider
    import json
    
    task_status = await task_service.get_task_status(db, task_id, user_id=current_user.user_id)
    if not task_status:
        raise HTTPException(status_code=404, detail="Task not found")
        
    traces = await get_traces_for_task(db, task_id, limit=5)
    trace_data = json.dumps([{"step": t.step, "input": getattr(t, 'input_data', None), "output": getattr(t, 'output_data', None)} for t in traces])
    
    prompt = f"Analyze the following failed task and its execution traces to determine the root cause and suggest a fix. Task directive: {task_status.get('payload')}\n\nTraces: {trace_data}"
    system = "You are an expert DevOps engineer and AI RCA (Root Cause Analyzer). Return a literal JSON exactly matching schema: {'analysis': 'str', 'fix_suggestion': 'str'} without any markdown formatting."
    
    choice = select_model("analysis")
    content, _, _ = await call_provider(choice=choice, prompt=prompt, context=system)
    
    try:
        data = json.loads(content.replace("```json", "").replace("```", "").strip())
        return RootCauseResponse(analysis=data.get('analysis', ''), fix_suggestion=data.get('fix_suggestion', ''))
    except:
        return RootCauseResponse(analysis="Failed to parse LLM analysis regarding the error.", fix_suggestion="Please check the raw logs or traces manually.")


