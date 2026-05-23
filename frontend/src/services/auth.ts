import { api } from "@/lib/api-client";
import type { User, AuthResponse } from "@/types";

export type { User, AuthResponse };

export interface LoginDto {
  email: string;
  password: string;
}

export interface SignupDto {
  name: string;
  email: string;
  password: string;
  role: import("@/types").UserRole;
}

export const authService = {
  async signup(data: SignupDto): Promise<AuthResponse> {
    return api.post<AuthResponse>("auth/signup", data);
  },

  async login(data: LoginDto): Promise<AuthResponse> {
    return api.post<AuthResponse>("auth/login", data);
  },

  async updateRole(role: string): Promise<AuthResponse> {
    return api.put<AuthResponse>("auth/role", { role });
  },

  async getMe(): Promise<User> {
    return api.get<User>("auth/me");
  },

  async logout(): Promise<void> {
    try {
      await api.post("auth/logout");
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("revora_token");
        localStorage.removeItem("revora_user");
        // Also remove the middleware cookie
        document.cookie = "is_authenticated=; Max-Age=0; path=/;";
      }
    }
  },

  /** Persist token to localStorage AND a cookie (for middleware SSR reads). */
  persistSession(response: AuthResponse): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("revora_token", response.accessToken);
    localStorage.setItem("revora_user", JSON.stringify(response.user));
    // Set cookie for middleware — store a presence flag only for security
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    document.cookie = `is_authenticated=1; Max-Age=${maxAge}; path=/; SameSite=Strict`;
  },
};
