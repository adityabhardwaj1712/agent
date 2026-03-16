export type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; error: unknown };

function apiBase() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<ApiResult<T>> {
  const { json, ...rest } = init || {};
  const token = typeof window !== "undefined" ? window.localStorage.getItem("agentcloud_token") : null;
  const res = await fetch(`${apiBase()}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers || {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: "no-store",
  });

  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  if (!res.ok) return { ok: false, status: res.status, error: parsed };
  return { ok: true, status: res.status, data: parsed as T };
}

