import os
from typing import List, Optional, Tuple, Any
from openai import AsyncOpenAI
from loguru import logger
from ..config import settings

class LLMService:
    """
    Unified LLM Service for AgentCloud.
    Supports OpenAI, Groq, and others via OpenAI-compatible API.
    """
    
    def __init__(self):
        # Prefer environment variables, fall back to settings object
        self.api_key = settings.OPENAI_API_KEY
        self.base_url = os.getenv("OPENAI_BASE_URL") # Optional for Groq/Local LLMs
        
        if not self.api_key:
            logger.warning("No LLM API Key found. System will operate in degraded mode.")
            
        self.client = AsyncOpenAI(
            api_key=self.api_key or "mock-key", 
            base_url=self.base_url
        )

    async def get_completion(
        self, 
        messages: List[dict], 
        model: str = "gpt-4o", 
        tools: Optional[List[dict]] = None,
        temperature: float = 0.7
    ) -> Tuple[Optional[str], Optional[List[Any]], Optional[Any]]:
        """
        Execute a chat completion request.
        Returns (content, tool_calls, usage)
        """
        if not self.api_key or self.api_key == "mock-key":
            logger.warning("Attempted LLM call without API key. Returning placeholder.")
            return "DEGRADED MODE: Please configure a real API key to activate AI reasoning.", None, None

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

            logger.debug(f"Calling LLM ({model}) with {len(messages)} messages")
            response = await self.client.chat.completions.create(**kwargs)
            message = response.choices[0].message
            usage = response.usage
            
            logger.debug(f"LLM response received. Tool calls: {bool(getattr(message, 'tool_calls', None))}")
            return message.content, getattr(message, "tool_calls", None), usage
        except Exception as e:
            logger.error(f"LLM Completion failed: {e}")
            raise

llm_service = LLMService()
