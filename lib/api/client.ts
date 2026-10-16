"use client";

import { API_URL } from "./config";
import { ApiClientError } from "./errors";
import type { ApiError, ApiSuccess, AuthUser } from "@/lib/types";

let inMemoryAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
const PROACTIVE_REFRESH_BUFFER_MS = 60_000;
const PROACTIVE_REFRESH_MIN_DELAY_MS = 5_000;

/** Decodes a JWT and returns its expiry as a Unix timestamp in milliseconds, or null if unreadable. */
function decodeJwtExpiryMs(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded =
      typeof atob === "function"
        ? atob(normalized)
        : Buffer.from(normalized, "base64").toString("utf-8");
    const { exp } = JSON.parse(decoded) as { exp?: number };
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function clearScheduledRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

/**
 * Redirects to the login page when the session has expired.
 * Only runs on admin pages — never loops on /admin/login itself.
 */
function redirectToLogin() {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) return;

  clearScheduledRefresh();
  inMemoryAccessToken = null;
  fetch("/admin/api/session", { method: "DELETE" }).catch(() => {});

  const from = pathname + search;
  window.location.href = `/admin/login?from=${encodeURIComponent(from)}&expired=1`;
}

/** Schedules a proactive token refresh before the current token expires. */
function scheduleProactiveRefresh(token: string) {
  clearScheduledRefresh();
  const expiryMs = decodeJwtExpiryMs(token);
  if (!expiryMs) return;

  const delay = Math.max(
    expiryMs - Date.now() - PROACTIVE_REFRESH_BUFFER_MS,
    PROACTIVE_REFRESH_MIN_DELAY_MS,
  );

  refreshTimer = setTimeout(() => {
    void refreshAccessToken();
  }, delay);
}

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  if (token) {
    scheduleProactiveRefresh(token);
  } else {
    clearScheduledRefresh();
  }
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip attaching Authorization header (public endpoints). */
  skipAuth?: boolean;
  /** Skip the automatic 401 → refresh → retry cycle. */
  skipRefresh?: boolean;
  /** Parse response as a binary Blob instead of JSON (file downloads). */
  responseType?: "json" | "blob";
}

/**
 * Calls the token refresh endpoint and deduplicates concurrent 401s into a
 * single refresh request. After a successful refresh, also syncs the new token
 * to the server-side session cookie so Server Components stay in sync.
 * Returns null (without redirecting) on network errors.
 */
async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) {
          redirectToLogin();
          return null;
        }
        const json = (await res.json()) as ApiSuccess<{ accessToken: string }>;
        const newToken = json.data.accessToken;
        setAccessToken(newToken);

        // Sync the new token to the server-side session cookie so Server Components
        // can attach it to their own fetches. Non-fatal if this fails.
        try {
          const meRes = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${newToken}` },
          });
          if (meRes.ok) {
            const meJson = (await meRes.json()) as ApiSuccess<AuthUser>;
            await fetch("/admin/api/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accessToken: newToken, user: meJson.data }),
            });
          }
        } catch {
          // Non-fatal — the server-side session will re-sync on the next refresh.
        }

        return newToken;
      } catch {
        // Network error — do not redirect.
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, skipRefresh, responseType = "json", headers, ...rest } = options;

  const doFetch = async (): Promise<Response> => {
    const finalHeaders: Record<string, string> = {
      ...(body !== undefined && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(headers as Record<string, string>),
    };
    if (!skipAuth && inMemoryAccessToken) {
      finalHeaders.Authorization = `Bearer ${inMemoryAccessToken}`;
    }

    return fetch(`${API_URL}${path}`, {
      ...rest,
      credentials: "include",
      headers: finalHeaders,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  };

  let res: Response;
  try {
    res = await doFetch();
  } catch {
    throw new ApiClientError("Can't reach the server, check your connection.", 0, {
      isNetworkError: true,
    });
  }

  // On a 401, attempt one token refresh and retry the original request.
  if (res.status === 401 && !skipAuth && !skipRefresh) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      try {
        res = await doFetch();
      } catch {
        throw new ApiClientError("Can't reach the server, check your connection.", 0, {
          isNetworkError: true,
        });
      }
    }
  }

  if (responseType === "blob") {
    if (!res.ok) {
      throw new ApiClientError("Download failed.", res.status);
    }
    return (await res.blob()) as unknown as T;
  }

  let json: ApiSuccess<T> | ApiError | undefined;
  try {
    json = await res.json();
  } catch {
    // Response had no body.
  }

  if (!res.ok || !json?.success) {
    const errJson = json as ApiError | undefined;
    throw new ApiClientError(errJson?.message ?? `Request failed (${res.status})`, res.status, {
      errors: errJson?.errors,
      code: errJson?.code,
    });
  }

  return (json as ApiSuccess<T>).data;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};