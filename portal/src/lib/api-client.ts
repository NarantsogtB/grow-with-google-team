const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("patient_token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Guard so a burst of 401s from concurrent requests only triggers one redirect.
let redirecting = false;

function handleUnauthorized() {
  if (typeof window === "undefined") return;
  if (redirecting) return;
  redirecting = true;
  // Drop the stale patient session — the backend no longer recognises its
  // JWT subject (e.g. DB re-seeded after the token was issued).
  localStorage.removeItem("patient_token");
  localStorage.removeItem("patient_session");
  if (!window.location.pathname.endsWith("/login")) {
    window.location.assign("/login");
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders() },
    ...init,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // keep statusText
    }
    if (res.status === 401) {
      handleUnauthorized();
    }
    throw new ApiError(res.status, detail);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
