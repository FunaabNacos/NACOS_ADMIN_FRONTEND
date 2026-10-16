import "server-only";
import { cookies } from "next/headers";
import { INTERNAL_API_URL } from "./config";
import { ApiClientError } from "./errors";
import { getServerSession } from "@/lib/session";
import type { ApiError, ApiSuccess, AuthUser } from "@/lib/types";

interface ServerFetchOptions {
  /** Query params to append to the URL. */
  searchParams?: Record<string, string | number | boolean | undefined>;
  /**
   * Defaults to 'no-store' since most data in this app is role-scoped or
   * financial. Pass { revalidate: N } only for genuinely public, low-sensitivity
   * data (e.g. the public tenant list).
   */
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
}

function buildUrl(path: string, searchParams?: ServerFetchOptions["searchParams"]) {
  const url = new URL(`${INTERNAL_API_URL}${path}`);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * Attempts a server-side token refresh by forwarding the refreshToken cookie
 * to the backend. On success, persists the new accessToken (and re-synced user)
 * back into the iron-session cookie so subsequent Server Component renders use
 * the fresh token. Returns the new accessToken, or null if refresh failed.
 */
async function serverRefreshAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;
    if (!refreshToken) return null;

    const res = await fetch(`${INTERNAL_API_URL}/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `refreshToken=${refreshToken}` },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = (await res.json()) as ApiSuccess<{ accessToken: string }>;
    const newAccessToken = json.data.accessToken;

    // Persist the new token back into the session cookie so the next
    // Server Component render (and serverFetch call) finds a valid token.
    const session = await getServerSession();
    session.accessToken = newAccessToken;

    // Re-sync the user record while we have a valid token in hand.
    try {
      const meRes = await fetch(`${INTERNAL_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${newAccessToken}` },
        cache: "no-store",
      });
      if (meRes.ok) {
        const meJson = (await meRes.json()) as ApiSuccess<AuthUser>;
        session.user = meJson.data;
      }
    } catch {
      // Non-fatal — keep the existing user record in the session.
    }

    await session.save();
    return newAccessToken;
  } catch {
    return null;
  }
}

/** Authenticated fetch for Server Components. Reads the access token from the
 *  session cookie. On a 401 it attempts one server-side token refresh and
 *  retries the request before giving up. */
export async function serverFetch<T>(
  path: string,
  options: ServerFetchOptions = {}
): Promise<T> {
  const session = await getServerSession();
  const headers: Record<string, string> = {};
  if (session.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;

  const url = buildUrl(path, options.searchParams);
  const fetchOptions = {
    cache: options.cache ?? "no-store",
    next: options.next,
  } as RequestInit;

  let res = await fetch(url, { ...fetchOptions, headers });

  // On 401, try a server-side refresh and retry once.
  if (res.status === 401) {
    const newToken = await serverRefreshAccessToken();
    if (newToken) {
      const retryHeaders: Record<string, string> = {
        Authorization: `Bearer ${newToken}`,
      };
      res = await fetch(url, { ...fetchOptions, headers: retryHeaders });
    }
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

/** Unauthenticated fetch for Server Components — no session cookie read. */
export async function publicServerFetch<T>(
  path: string,
  options: ServerFetchOptions = {}
): Promise<T> {
  const res = await fetch(buildUrl(path, options.searchParams), {
    cache: options.cache ?? "no-store",
    next: options.next,
  });

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