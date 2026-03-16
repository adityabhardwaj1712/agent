import os
import hashlib
from typing import List


def _hash_embedding(text: str, dim: int = 1536) -> List[float]:
    # Deterministic fallback embedding (not semantic, but stable).
    h = hashlib.sha256(text.encode("utf-8")).digest()
    out = []
    for i in range(dim):
        b = h[i % len(h)]
        out.append(((b / 255.0) * 2.0) - 1.0)
    return out


def embed(text: str) -> List[float]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return _hash_embedding(text)

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)
        model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        res = client.embeddings.create(model=model, input=text)
        return list(res.data[0].embedding)
    except Exception:
        return _hash_embedding(text)
