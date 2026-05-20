"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "@/services/auth";
import type { User, UserRole } from "@/types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; role: UserRole }) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getRoleRedirect(role: UserRole): string {
  if (role === "ADMIN") return "/admin";
  if (role === "DESIGNER") return "/designer";
  return "/dashboard";
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // Restore session on mount — validate token freshness via /auth/me
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("revora_token");
      const storedUser = localStorage.getItem("revora_user");

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser)); // Optimistic set to avoid flash
          const freshUser = await authService.getMe();
          setUser(freshUser);
          localStorage.setItem("revora_user", JSON.stringify(freshUser));
        } catch {
          // Token expired or invalid — clean up silently
          await authService.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const login = useCallback(async (data: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authService.login(data);
      authService.persistSession(res);
      setUser(res.user);
      router.push(getRoleRedirect(res.user.role));
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const signup = useCallback(async (data: { name: string; email: string; password: string; role: UserRole }) => {
    setLoading(true);
    try {
      const res = await authService.signup(data);
      authService.persistSession(res);
      setUser(res.user);
      router.push(getRoleRedirect(res.user.role));
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setLoading(false);
      router.push("/login");
    }
  }, [router]);

  const hasRole = useCallback((roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, signup, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
