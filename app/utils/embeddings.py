import os
import hashlib
from typing import List
from loguru import logger


def _hash_embedding(text: str, dim: int = 1536) -> List[float]:
    # Deterministic fallback embedding (not semantic, but stable).
    h = hashlib.sha256(text.encode("utf-8")).digest()
    out = []
    for i in range(dim):
        b = h[i % len(h)]
        out.append(((b / 255.0) * 2.0) - 1.0)
    return out


async def embed_async(text: str) -> List[float]:
    """
    Generate real semantic embeddings using OpenAI text-embedding-3-small asynchronously.
    Falls back to a deterministic hash only if API key is missing or call fails.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.warning("OPENAI_API_KEY not set. Using hashing fallback for embeddings.")
        return _hash_embedding(text)

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=api_key)
        model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        
        # Real semantic vector generation
        res = await client.embeddings.create(model=model, input=text)
        return list(res.data[0].embedding)
    except Exception as e:
        logger.error(f"OpenAI Embedding failed: {e}. Falling back to hash.")
        return _hash_embedding(text)

def embed(text: str) -> List[float]:
    # Legacy sync wrapper (should be avoided in async paths)
    return _hash_embedding(text)

