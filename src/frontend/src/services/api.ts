export const API_BASE_URL = (import.meta.env.VITE_API_URL?.trim() || "/api").replace(/\/$/, "");

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getAuthToken() {
  return sessionStorage.getItem("barbeariaPrimeToken");
}

export function setAuthToken(token: string) {
  sessionStorage.setItem("barbeariaPrimeToken", token);
}

export function clearAuthToken() {
  sessionStorage.removeItem("barbeariaPrimeToken");
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth) {
    const token = getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, payload?.error || `Erro HTTP: ${response.status}`);
  }

  return payload as T;
}
