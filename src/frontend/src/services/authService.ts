import { apiRequest, clearAuthToken, setAuthToken } from "./api";

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    name: string;
    role: string;
  };
}

interface SessionResponse {
  success: boolean;
  user: {
    name: string;
    role: string;
  };
}

export const authService = {
  async login(password: string) {
    const response = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ password })
    });

    // Store only the short-lived admin token; public booking flows never need it.
    setAuthToken(response.token);
    return response;
  },

  logout() {
    clearAuthToken();
  },

  async getSession() {
    return apiRequest<SessionResponse>("/auth/me", {
      auth: true
    });
  }
};
