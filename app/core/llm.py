import os
import logging
from typing import List, Optional, Tuple, Any
from openai import AsyncOpenAI
from ..config import settings

logger = logging.getLogger(__name__)

class LLMService:
    """
    Unified LLM Service for AgentCloud.
    Supports OpenAI, Groq, and others via OpenAI-compatible API.
    """
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY") or getattr(settings, "OPENAI_API_KEY", None)
        self.base_url = os.getenv("OPENAI_BASE_URL") # Optional for Groq/Local LLMs
        
        if not self.api_key:
            logger.warning("No LLM API Key found. System will operate in degraded mode.")
            
        self.client = AsyncOpenAI(api_key=self.api_key or "mock-key", base_url=self.base_url)

    async def get_completion(
        self, 
        messages: List[dict], 
        model: str = "gpt-4o", 
        tools: Optional[List[dict]] = None,
        temperature: float = 0.7
    ) -> Tuple[Optional[str], Optional[List[Any]]]:
        """
        Execute a chat completion request.
        Returns (content, tool_calls)
        """
        if not self.api_key or self.api_key == "mock-key":
            return "DEGRADED MODE: Please configure a real API key to activate AI reasoning.", None

        try:
            kwargs = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "timeout": 60.0
            }
            if tools:
                kwargs["tools"] = tools
                kwargs["tool_choice"] = "auto"

            response = await self.client.chat.completions.create(**kwargs)
            message = response.choices[0].message
            return message.content, getattr(message, "tool_calls", None)
        except Exception as e:
            logger.error(f"LLM Completion failed: {e}")
            raise

llm_service = LLMService()
