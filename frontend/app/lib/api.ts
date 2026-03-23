export type ApiResult<T> = 
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: unknown };

function apiBase(): string {
  return (typeof window !== "undefined"
    ? (window as any).__NEXT_PUBLIC_API_BASE_URL
    : undefined) ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000";
}

export function getToken(): string | null {
  try {
    return typeof window !== "undefined"
      ? window.localStorage.getItem("agentcloud_token")
      : null;
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    if (typeof window !== "undefined")
      window.localStorage.setItem("agentcloud_token", token);
  } catch {}
}

export function clearToken(): void {
  try {
    if (typeof window !== "undefined")
      window.localStorage.removeItem("agentcloud_token");
  } catch {}
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<ApiResult<T>> {
  const { json, ...rest } = init || {};
  const token = getToken();

  let res: Response;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(rest.headers || {}),
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      cache: "no-store",
    });
  } catch (networkErr) {
    return { ok: false, status: 0, error: { message: "Network error — is the backend running?" } };
  }

  const text = await res.text().catch(() => "");
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  if (!res.ok) return { ok: false, status: res.status, error: parsed };
  return { ok: true, status: res.status, data: parsed as T };
}

/** Convenience: returns data or throws a friendly error string */
export async function apiFetch<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const result = await apiJson<T>(path, init);
  if (!result.ok) {
    const msg = (result.error as any)?.detail || (result.error as any)?.message || `HTTP ${result.status}`;
    throw new Error(msg);
  }
  return result.data;
}

export function wsUrl(path: string): string {
  const base = apiBase().replace(/^http/, "ws");
  return `${base}${path}`;
}
