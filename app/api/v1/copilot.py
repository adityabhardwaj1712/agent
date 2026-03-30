from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import json
import asyncio

from ..deps import get_current_user
from ...models.user import User
from ...services.model_router import select_model, call_provider
from ...services import memory_service
from ...db.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

class CopilotRequest(BaseModel):
    prompt: str

class CopilotResponse(BaseModel):
    name: str
    description: str
    definition: dict

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    agent_id: Optional[str] = None

SYSTEM_PROMPT = """
You are an expert AI orchestrator. The user will give you a natural language instruction to create an autonomous workflow.
Your goal is to output a valid JSON representing the workflow.

The output JSON MUST follow exactly this schema (do NOT output any markdown, ONLY valid JSON):
{
    "name": "Short Name of Workflow",
    "description": "Short description",
    "definition": {
        "nodes": [
            {
                "nid": "n1",
                "name": "Node Name",
                "agent": "RoleOfAgent",
                "prompt": "Detailed prompt for the agent",
                "x": 100,
                "y": 150,
                "status": "idle"
            }
        ],
        "edges": [
            {
                "from": "n1",
                "to": "n2"
            }
        ]
    }
}

Use logical x,y positioning so the nodes flow left-to-right visually.
"""

@router.post("/generate-workflow", response_model=CopilotResponse)
async def generate_workflow(
    request: CopilotRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        choice = select_model("complex workflow generation")
        content, _, _ = await call_provider(
            choice=choice,
            prompt=request.prompt,
            context=SYSTEM_PROMPT
        )
        
        # Clean up potential markdown formatting from LLM
        content = content.replace("```json", "").replace("```", "").strip()
        data = json.loads(content)
        
        return CopilotResponse(**data)
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"LLM did not return valid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def copilot_chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Streaming chat endpoint for the Copilot.
    """
    async def chat_generator():
        from ...core.llm import llm_service
        
        # 1. RAG Enrichment
        user_query = request.messages[-1].content if request.messages else ""
        memories = await memory_service.search_memory(db, "system", user_query, limit=3)
        
        context_str = ""
        if memories:
            context_str = "\n\nRelevant Context from Knowledge Hub:\n" + "\n---\n".join([m.content for m in memories])
        
        # 2. System Prompt Injection
        enhanced_system = f"You are the AgentCloud Copilot. Assist the user with their agent fleet and tasks.{context_str}"
        
        # 3. Message Assembly
        msgs = [{"role": "system", "content": enhanced_system}]
        for m in request.messages:
            msgs.append({"role": m.role, "content": m.content})
        
        # 4. Real Streaming
        yield "data: " + json.dumps({"role": "assistant", "content": "", "type": "start"}) + "\n\n"
        
        try:
            async for chunk in llm_service.stream_completion(msgs, model="gpt-4o-mini"):
                yield "data: " + json.dumps({"content": chunk}) + "\n\n"
        except Exception as e:
            logger.error(f"Copilot Stream Error: {e}")
            yield "data: " + json.dumps({"content": f"\n\n[System Error: {str(e)}]"}) + "\n\n"
            
        yield "data: [DONE]\n\n"

    return StreamingResponse(chat_generator(), media_type="text/event-stream")
