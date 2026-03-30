from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import json
import asyncio

from ..deps import get_current_user
from ...models.user import User
from ...services.model_router import select_model, call_provider

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
    current_user: User = Depends(get_current_user)
):
    """
    Streaming chat endpoint for the Copilot.
    """
    async def chat_generator():
        from ...core.llm import llm_service
        
        # Convert Pydantic messages to dict
        msgs = [{"role": m.role, "content": m.content} for m in request.messages]
        
        # We manually use the underlying provider call to get a stream if possible
        # For now, we'll use a simplified mock stream to demonstrate the UI
        # In production, this would use llm_service._call_openai(stream=True)
        
        yield "data: " + json.dumps({"role": "assistant", "content": "", "type": "start"}) + "\n\n"
        
        full_text = "I am initializing the neural link... How can I assist you with your agent fleet today?"
        for word in full_text.split():
            await asyncio.sleep(0.05)
            yield "data: " + json.dumps({"content": word + " "}) + "\n\n"
            
        yield "data: [DONE]\n\n"

    return StreamingResponse(chat_generator(), media_type="text/event-stream")
