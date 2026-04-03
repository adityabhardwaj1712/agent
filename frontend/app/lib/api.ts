export class APIError extends Error {
  constructor(public status: number, public data: unknown, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

export type ApiResult<T> = 
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: unknown };

function apiBase(): string {
  // 1. Check if we're in a browser
  const isBrowser = typeof window !== "undefined";
  
  // 2. Priority: Explicit env var > Detected host > localhost
  let base = (isBrowser ? (window as any).__NEXT_PUBLIC_API_BASE_URL : undefined) ||
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!base && isBrowser) {
    // Dynamically derive from current page to support IP-based access
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    base = `${protocol}//${hostname}:8000`;
  }
  
  base = base || "http://localhost:8000";
  
  return base.endsWith('/') ? base + 'v1' : base + '/v1';
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
  init?: RequestInit & { json?: unknown, timeout?: number }
): Promise<ApiResult<T>> {
  const { json, timeout = 30000, ...rest } = init || {};
  const token = getToken();

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  let res: Response;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(rest.headers || {}),
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      cache: "no-store",
    });
    clearTimeout(id);
  } catch (networkErr: any) {
    clearTimeout(id);
    if (networkErr.name === 'AbortError') {
      return { ok: false, status: 408, error: { message: `Request timed out after ${timeout}ms` } };
    }
    return { ok: false, status: 0, error: { message: "Network error — is the backend running?" } };
  }

  const text = await res.text().catch(() => "");
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      if (typeof window !== "undefined") {
         // Optionally trigger a page refresh or event
         window.dispatchEvent(new Event("unauthorized"));
      }
    }
    return { ok: false, status: res.status, error: parsed };
  }
  return { ok: true, status: res.status, data: parsed as T };

}

/** Convenience: returns data or throws a structured APIError */
export async function apiFetch<T>(path: string, init?: RequestInit & { json?: unknown, timeout?: number }): Promise<T> {
  const result = await apiJson<T>(path, init);
  if (!result.ok) {
    const msg = (result.error as any)?.detail || (result.error as any)?.message || `HTTP ${result.status}`;
    throw new APIError(result.status, result.error, msg);
  }
  return result.data;
}

export function wsUrl(path: string): string {
  const base = apiBase().replace(/^http/, "ws");
  const token = getToken();
  const url = `${base}${path}`;
  if (!token) return url;
  
  // Use URL object to handle query params robustly
  const fullUrl = new URL(url);
  fullUrl.searchParams.set("token", token);
  return fullUrl.toString();
}

