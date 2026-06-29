import { apiRequest } from "./api";

interface SessionResponse {
  user: { name: string; role: string };
}

const TOKEN_KEY = "barbeariaPrimeToken";

export const authService = {
  async login(password: string) {
    const response = await apiRequest<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ password })
    });

    // Store only the short-lived admin token; public booking flows never need it.
    sessionStorage.setItem(TOKEN_KEY, response.token);
    return response;
  },

  logout() {
    sessionStorage.removeItem(TOKEN_KEY);
  },

  async getSession() {
    const response = await apiRequest<SessionResponse>("/auth/me", { auth: true });
    return response;
  }
};
