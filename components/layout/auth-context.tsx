"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiClient, setAccessToken } from "@/lib/api/client";
import { paths } from "@/lib/api/paths";
import type { AuthUser, LoginResponse } from "@/lib/types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  // Hydrate the in-memory token and user from the server-side session cookie on mount.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/admin/api/session");
        const json = (await res.json()) as {
          data: { user: AuthUser | null; accessToken: string | null };
        };
        if (cancelled) return;
        if (json.data.accessToken) setAccessToken(json.data.accessToken);
        setUserState(json.data.user);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setUser = React.useCallback((next: AuthUser | null) => setUserState(next), []);

  const login = React.useCallback(async (email: string, password: string) => {
    const result = await apiClient.post<LoginResponse>(paths.auth.login, { email, password }, {
      skipAuth: true,
    });
    setAccessToken(result.accessToken);
    await fetch("/admin/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: result.accessToken, user: result.user }),
    });
    setUserState(result.user);
    return result.user;
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await apiClient.post(paths.auth.logout, undefined, { skipRefresh: true });
    } catch {
    }
    setAccessToken(null);
    setUserState(null);
    await fetch("/admin/api/session", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }, [router]);

  const value = React.useMemo(
    () => ({ user, isLoading, login, logout, setUser }),
    [user, isLoading, login, logout, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}