from __future__ import annotations

import os
from typing import Any, List, Optional, Tuple
from loguru import logger
from ..config import settings


class LLMService:
    """
    Unified LLM Service.  One interface, three providers.
    Provider is selected by model name prefix:
      gpt-*         ? OpenAI
      claude-*      ? Anthropic
      gemini-*      ? Google Gemini
    """

    def __init__(self):
        self._openai_client: Any = None
        self._anthropic_client: Any = None
        self._gemini_client: Any = None
        self._gemini_client: Any = None
        self._groq_client: Any = None
        self._ollama_client: Any = None

    # --- lazy clients --------------------------------------------------------

    def _openai(self):
        if self._openai_client is None:
            from openai import AsyncOpenAI
            key = settings.OPENAI_API_KEY
            if not key or "sk-proj-***" in key or "placeholder" in key:
                logger.warning("OPENAI_API_KEY is missing or invalid. AXON will attempt mock responses for core tasks.")
                # We'll allow it to initialize but it will fail on call; we catch that in get_completion
            self._openai_client = AsyncOpenAI(api_key=key or "sk-none")
        return self._openai_client

    def _anthropic(self):
        if self._anthropic_client is None:
            import anthropic
            key = settings.ANTHROPIC_API_KEY
            if not key:
                raise RuntimeError("ANTHROPIC_API_KEY not set")
            self._anthropic_client = anthropic.AsyncAnthropic(api_key=key)
        return self._anthropic_client

    def _gemini(self):
        if self._gemini_client is None:
            import google.generativeai as genai
            key = settings.GOOGLE_API_KEY
            if not key:
                raise RuntimeError("GOOGLE_API_KEY not set")
            genai.configure(api_key=key)
            self._gemini_client = genai
        return self._gemini_client

    def _groq(self):
        if self._groq_client is None:
            from groq import AsyncGroq
            key = settings.GROQ_API_KEY
            if not key:
                raise RuntimeError("GROQ_API_KEY not set")
            self._groq_client = AsyncGroq(api_key=key)
        return self._groq_client

    def _ollama(self):
        if self._ollama_client is None:
            import httpx
            # Use host's Ollama default port if missing
            base_url = os.getenv("OLLAMA_API_BASE", "http://host.docker.internal:11434")
            if "host.docker.internal" in base_url and os.name != 'nt':
                # Simplified fallback for Linux docker environments
                base_url = "http://172.17.0.1:11434"
            self._ollama_client = httpx.AsyncClient(base_url=base_url, timeout=120.0)
        return self._ollama_client

    # --- New Streaming Interface ---------------------------------------------

    async def stream_completion(
        self,
        messages: List[dict],
        model: str = "gpt-4o-mini",
        temperature: float = 0.7,
    ):
        """
        Returns an async generator of (role, content, chunk_type).
        """
        if model.startswith("claude-"):
            async for chunk in self._stream_anthropic(messages, model, temperature):
                yield chunk
        elif model.startswith("groq-") or model.startswith("llama3-") or model.startswith("mixtral-"):
            async for chunk in self._stream_groq(messages, model, temperature):
                yield chunk
        elif model.startswith("ollama/") or model.startswith("gemma"):
            async for chunk in self._stream_ollama(messages, model, temperature):
                yield chunk
        else:
            async for chunk in self._stream_openai(messages, model, temperature):
                yield chunk

    # --- provider dispatch ---------------------------------------------------

    async def get_completion(
        self,
        messages: List[dict],
        model: str = "gpt-4o-mini",
        tools: Optional[List[dict]] = None,
        temperature: float = 0.7,
        task_id: Optional[str] = None,
    ) -> Tuple[Optional[str], Optional[List[Any]], Optional[Any]]:
        """
        Returns (content, tool_calls, usage).
        Automatically routes to the right provider based on model name.
        """
        logger.debug(f"LLM call ? model={model} msgs={len(messages)}")

        if model.startswith("claude-"):
            res = await self._call_anthropic(messages, model, tools, temperature, task_id)
        elif model.startswith("gemini-"):
            res = await self._call_gemini(messages, model, tools, temperature)
        elif model.startswith("groq-") or model.startswith("llama3-") or model.startswith("mixtral-"):
            res = await self._call_groq(messages, model, tools, temperature, task_id)
        elif model.startswith("ollama/") or model.startswith("gemma"):
            res = await self._call_ollama(messages, model, tools, temperature, task_id)
        else:
            res = await self._call_openai(messages, model, tools, temperature, task_id)

        content, tool_calls, usage = res
        if usage:
            usage.cost_usd = self.calculate_cost(model, usage)
        return content, tool_calls, usage

    async def get_ensemble_completion(
        self,
        messages: List[dict],
        models: List[str],
        synthesizer_model: str = "gpt-4o-mini",
        temperature: float = 0.7,
        user_id: Optional[str] = None,
        agent_id: Optional[str] = None,
    ) -> dict:
        """
        Polls multiple models concurrently and synthesizes their responses into a single output.
        Tracks aggregate token usage for billing transparency.
        """
        import asyncio
        logger.info(f"Starting ensemble completion with models: {models} -> synth: {synthesizer_model}")
        
        # 1. Fire queries concurrently
        tasks = [
            self.get_completion(messages, model=m, temperature=temperature)
            for m in models
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 2. Collect results and track usage
        valid_responses = []
        total_prompt_tokens = 0
        total_completion_tokens = 0
        
        for i, res in enumerate(results):
            if isinstance(res, Exception):
                logger.warning(f"Ensemble model {models[i]} failed: {res}")
            else:
                content, _, usage = res
                if content:
                    valid_responses.append((models[i], content))
                    if usage:
                        total_prompt_tokens += usage.prompt_tokens
                        total_completion_tokens += usage.completion_tokens
                    
        if not valid_responses:
            raise RuntimeError("All models in the ensemble failed to produce a response.")
            
        # 3. Short-circuit if only one succeeded
        if len(valid_responses) == 1:
            return {
                "content": valid_responses[0][1],
                "ensemble_count": 1,
                "synthesized": False,
                "usage": {
                    "prompt_tokens": total_prompt_tokens,
                    "completion_tokens": total_completion_tokens,
                    "total_tokens": total_prompt_tokens + total_completion_tokens
                }
            }
            
        # 4. Synthesis
        synthesis_prompt = (
            "You are a master synthesizer. You are provided with responses from multiple AI models to a user query. "
            "Synthesize an optimal final answer gathering the best insights from all of them while resolving contradictions.\n\n"
        )
        synthesis_prompt += f"USER QUERY:\n{messages[-1]['content'] if messages else 'N/A'}\n\n"
        synthesis_prompt += "MODEL RESPONSES:\n"
        for model_name, content in valid_responses:
            synthesis_prompt += f"--- {model_name} ---\n{content}\n\n"
            
        synth_messages = [{"role": "system", "content": synthesis_prompt}]
        synth_content, _, synth_usage = await self.get_completion(synth_messages, model=synthesizer_model, temperature=0.3)
        
        if synth_usage:
            total_prompt_tokens += synth_usage.prompt_tokens
            total_completion_tokens += synth_usage.completion_tokens
            
        # 5. Billing integration
        if user_id and agent_id:
            try:
                from ..services.billing_service import billing_service
                await billing_service.charge(
                    user_id=user_id,
                    agent_id=agent_id,
                    tokens=total_prompt_tokens + total_completion_tokens,
                    model=f"ensemble({','.join(models)})"
                )
            except Exception as e:
                logger.error(f"Ensemble billing failed: {e}")

        return {
            "content": synth_content,
            "ensemble_count": len(valid_responses),
            "synthesized": True,
            "usage": {
                "prompt_tokens": total_prompt_tokens,
                "completion_tokens": total_completion_tokens,
                "total_tokens": total_prompt_tokens + total_completion_tokens
            }
        }

    # --- OpenAI --------------------------------------------------------------

    async def _call_openai(self, messages, model, tools, temperature, task_id=None):
        kwargs: dict = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "timeout": 60.0,
        }
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"
            
        if task_id and not tools:
            kwargs["stream"] = True

        try:
            resp = await self._openai().chat.completions.create(**kwargs)
            
            if task_id and not tools:
                from ..db.redis_client import get_async_redis_client
                redis = await get_async_redis_client()
                import json
                chunks = []
                async for chunk in resp:
                    if not chunk.choices: continue
                    delta = chunk.choices[0].delta
                    if delta.content:
                        chunks.append(delta.content)
                        await redis.publish(f"task_stream:{task_id}", json.dumps({"task_id": task_id, "chunk": delta.content}))
                return "".join(chunks), None, _Usage(0, 0, 0)

            msg = resp.choices[0].message
            return msg.content, getattr(msg, "tool_calls", None), getattr(resp, "usage", _Usage(0, 0, 0))
        except Exception as e:
            if "invalid_api_key" in str(e).lower() or "401" in str(e):
                logger.error(f"Critical Auth Failure (OpenAI): {e}")
                return "ERROR: LLM Authentication Failed. Please check your OPENAI_API_KEY.", None, _Usage(0,0,0)
            raise

    async def _stream_openai(self, messages, model, temperature):
        try:
            resp = await self._openai().chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                stream=True,
            )
            async for chunk in resp:
                if not chunk.choices: continue
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content
        except Exception as e:
            logger.error(f"OpenAI Stream Failed: {e}")
            yield f"ERROR: {str(e)}"

    # --- Groq ----------------------------------------------------------------

    async def _call_groq(self, messages, model, tools, temperature, task_id=None):
        kwargs: dict = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "timeout": 30.0,
        }
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        if task_id and not tools:
            kwargs["stream"] = True

        resp = await self._groq().chat.completions.create(**kwargs)
        
        if task_id and not tools:
            from ..db.redis_client import get_async_redis_client
            redis = await get_async_redis_client()
            import json
            chunks = []
            async for chunk in resp:
                if not chunk.choices: continue
                delta = chunk.choices[0].delta
                if delta.content:
                    chunks.append(delta.content)
                    await redis.publish(f"task_stream:{task_id}", json.dumps({"task_id": task_id, "chunk": delta.content}))
            return "".join(chunks), None, _Usage(0, 0, 0)

        msg = resp.choices[0].message
        return msg.content, getattr(msg, "tool_calls", None), getattr(resp, "usage", _Usage(0, 0, 0))

    async def _stream_groq(self, messages, model, temperature):
        try:
            resp = await self._groq().chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                stream=True,
            )
            async for chunk in resp:
                if not chunk.choices: continue
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content
        except Exception as e:
            logger.error(f"Groq Stream Failed: {e}")
            yield f"ERROR: {str(e)}"

    # --- Anthropic -----------------------------------------------------------

    async def _call_anthropic(self, messages, model, tools, temperature, task_id=None):
        """
        Translates the OpenAI message format ? Anthropic format.
        System messages are extracted and passed separately.
        Tool definitions are translated from OpenAI schema ? Anthropic schema.
        """
        system = ""
        anthropic_messages = []

        for m in messages:
            role = m["role"]
            content = m.get("content") or ""
            if role == "system":
                system = content
            elif role == "tool":
                # Map OpenAI tool result ? Anthropic tool_result block
                anthropic_messages.append({
                    "role": "user",
                    "content": [{
                        "type": "tool_result",
                        "tool_use_id": m.get("tool_call_id", ""),
                        "content": content,
                    }]
                })
            else:
                # user / assistant
                tool_calls = m.get("tool_calls")
                if tool_calls:
                    blocks = []
                    if content:
                        blocks.append({"type": "text", "text": content})
                    for tc in tool_calls:
                        import json
                        blocks.append({
                            "type": "tool_use",
                            "id": tc.id,
                            "name": tc.function.name,
                            "input": json.loads(tc.function.arguments or "{}"),
                        })
                    anthropic_messages.append({"role": "assistant", "content": blocks})
                else:
                    anthropic_messages.append({"role": role, "content": content})

        kwargs: dict = {
            "model": model,
            "max_tokens": 4096,
            "temperature": temperature,
            "messages": anthropic_messages,
        }
        if system:
            kwargs["system"] = system
        if tools:
            kwargs["tools"] = [
                {
                    "name": t["function"]["name"],
                    "description": t["function"].get("description", ""),
                    "input_schema": t["function"].get("parameters", {"type": "object", "properties": {}}),
                }
                for t in tools
            ]

        if task_id and not tools:
            kwargs["stream"] = True

        resp = await self._anthropic().messages.create(**kwargs)
        
        if task_id and not tools:
            from ..db.redis_client import get_async_redis_client
            redis = await get_async_redis_client()
            import json
            chunks = []
            async for event in resp:
                if event.type == "content_block_delta" and event.delta.type == "text_delta":
                    chunks.append(event.delta.text)
                    await redis.publish(f"task_stream:{task_id}", json.dumps({"task_id": task_id, "chunk": event.delta.text}))
            return "".join(chunks), None, _Usage(0, 0, 0)

        text_content = ""
        tool_calls_out = []

        for block in resp.content:
            if block.type == "text":
                text_content += block.text
            elif block.type == "tool_use":
                # Wrap in OpenAI-compatible shape so the rest of the worker doesn't change
                tool_calls_out.append(_AnthropicToolCall(block.id, block.name, block.input))

        usage = _Usage(
            prompt_tokens=resp.usage.input_tokens,
            completion_tokens=resp.usage.output_tokens,
            total_tokens=resp.usage.input_tokens + resp.usage.output_tokens,
        )
        return text_content or None, tool_calls_out or None, usage

    async def _stream_anthropic(self, messages, model, temperature):
        system = ""
        anthropic_messages = []
        for m in messages:
            if m["role"] == "system": system = m["content"]
            else: anthropic_messages.append({"role": m["role"], "content": m["content"]})

        try:
            async with self._anthropic().messages.stream(
                model=model,
                max_tokens=4096,
                system=system,
                messages=anthropic_messages,
                temperature=temperature,
            ) as stream:
                async for chunk in stream.text_stream:
                    yield chunk
        except Exception as e:
            logger.error(f"Anthropic Stream Failed: {e}")
            yield f"ERROR: {str(e)}"

    # --- Google Gemini --------------------------------------------------------

    async def _call_gemini(self, messages, model, tools, temperature):
        """
        Translates messages to Gemini content format.
        Tool calls are not yet translated (Gemini has different function-calling API).
        """
        import asyncio, functools
        genai = self._gemini()
        gemini_model = genai.GenerativeModel(
            model_name=model,
            generation_config={"temperature": temperature},
        )

        # Build conversation history
        history = []
        last_user_content = ""
        for m in messages:
            role = m["role"]
            content = m.get("content") or ""
            if role == "system":
                # Prepend system prompt to first user turn
                last_user_content = f"{content}\n\n"
            elif role == "user":
                history.append({"role": "user", "parts": [last_user_content + content]})
                last_user_content = ""
            elif role == "assistant":
                history.append({"role": "model", "parts": [content]})

        if not history:
            history.append({"role": "user", "parts": [last_user_content]})

        # Use executor so we don't block the event loop (Gemini SDK is sync)
        loop = asyncio.get_running_loop()
        chat = gemini_model.start_chat(history=history[:-1])
        response = await loop.run_in_executor(
            None,
            functools.partial(chat.send_message, history[-1]["parts"][0])
        )

        text = response.text
        usage = _Usage(
            prompt_tokens=0,  # Gemini doesn't always expose token counts
            completion_tokens=0,
            total_tokens=0,
        )
        return text, None, usage

    # --- Ollama (Gemma 3) --------------------------------------------------

    async def _call_ollama(self, messages, model, tools, temperature, task_id=None):
        import json
        clean_model = model.replace("ollama/", "")
        
        payload = {
            "model": clean_model,
            "messages": messages,
            "options": {"temperature": temperature},
            "stream": False
        }
        
        client = self._ollama()
        
        if task_id and not tools:
            payload["stream"] = True
            from ..db.redis_client import get_async_redis_client
            redis = await get_async_redis_client()
            chunks = []
            
            async with client.stream("POST", "/api/chat", json=payload) as response:
                async for line in response.aiter_lines():
                    if line:
                        data = json.loads(line)
                        content = data.get("message", {}).get("content", "")
                        if content:
                            chunks.append(content)
                            await redis.publish(f"task_stream:{task_id}", json.dumps({"task_id": task_id, "chunk": content}))
            return "".join(chunks), None, _Usage(0, 0, 0)
            
        # Non-streaming
        resp = await client.post("/api/chat", json=payload)
        resp.raise_for_status()
        data = resp.json()
        
        content = data.get("message", {}).get("content", "")
        # Ollama usage (eval_count approx completion, prompt_eval_count param prompt)
        usage = _Usage(
            prompt_tokens=data.get("prompt_eval_count", 0),
            completion_tokens=data.get("eval_count", 0),
            total_tokens=data.get("prompt_eval_count", 0) + data.get("eval_count", 0),
        )
        
        # NOTE: Tool calls for Ollama depend on the model (llama3 supports them, older models don't)
        # We will return basic text for Gemma 3 as a baseline.
        return content, None, usage

    async def _stream_ollama(self, messages, model, temperature):
        import json
        clean_model = model.replace("ollama/", "")
        payload = {
            "model": clean_model,
            "messages": messages,
            "options": {"temperature": temperature},
            "stream": True
        }
        
        try:
            client = self._ollama()
            async with client.stream("POST", "/api/chat", json=payload) as response:
                async for line in response.aiter_lines():
                    if line:
                        data = json.loads(line)
                        content = data.get("message", {}).get("content", "")
                        if content:
                            yield content
        except Exception as e:
            logger.error(f"Ollama Stream Failed: {e}")
            yield f"ERROR: {str(e)}"

    async def complete(
        self,
        messages: List[dict],
        model: str = "gpt-4o-mini",
        tools: Optional[List[dict]] = None,
        agent_id: Optional[str] = None, # For logging context
        task_id: Optional[str] = None,
    ) -> dict:
        """Compatibility shim for existing worker code."""
        content, tool_calls, usage = await self.get_completion(messages, model, tools, task_id=task_id)
        return {
            "content": content,
            "tool_calls": tool_calls,
            "tokens_used": usage.total_tokens if usage else 0,
            "cost_usd": usage.cost_usd if usage else 0.0
        }


# --- Shim types so the rest of the codebase stays unchanged ------------------

import json as _json
from dataclasses import dataclass


@dataclass
class _FunctionCall:
    name: str
    arguments: str  # JSON string


@dataclass
class _AnthropicToolCall:
    """Mimics openai.types.chat.ChatCompletionMessageToolCall"""
    id: str
    _name: str
    _input: dict

    def __post_init__(self):
        self.function = _FunctionCall(
            name=self._name,
            arguments=_json.dumps(self._input),
        )


@dataclass
class _Usage:
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_usd: float = 0.0


llm_service = LLMService()
