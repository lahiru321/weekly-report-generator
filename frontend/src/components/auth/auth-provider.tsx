"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (fullName: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load the current user once on app start (the cookie is sent automatically)
  useEffect(() => {
    api<User>("/auth/me")
      .then(setUser)
      .catch(async (error) => {
        // A cookie exists but is invalid or expired: clear it so /login is reachable again
        if (error instanceof ApiError && error.status === 401) {
          await api("/auth/logout", { method: "POST" }).catch(() => {});
        }
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedIn = await api<User>("/auth/login", { method: "POST", body: { email, password } });
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    const created = await api<User>("/auth/register", { method: "POST", body: { fullName, email, password } });
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
