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
    cache: options.cache ?? (options.method ? undefined : "no-store"),
    headers
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      if (!response.ok) {
        throw new ApiError(response.status, `Erro HTTP: ${response.status}`);
      }

      throw new Error("A API retornou uma resposta inválida.");
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `Erro HTTP: ${response.status}`;

    throw new ApiError(response.status, message);
  }

  return payload as T;
}
