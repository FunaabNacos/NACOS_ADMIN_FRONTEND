// API_URL is used by browser-side code (apiClient, templates.ts).
// In development it is a relative path so all requests go through the
// Next.js rewrite proxy on the same origin — this is the only way to make
// the backend's httpOnly refreshToken cookie work without HTTPS, because
// browsers refuse to send cross-origin cookies unless the connection is
// secure.
// In production the Next.js app and the API are on the same domain (or the
// rewrite handles it the same way), so a relative path works there too.
// The rewrite rule in next.config.ts forwards /api/v1/* → the real backend.
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured");
}

export const API_URL = apiUrl;

// INTERNAL_API_URL is used exclusively by server-side code (server-fetch.ts,
// the session route handler). Server Components run inside the Next.js
// Node process and can reach the backend directly without going through the
// proxy, so we use the real backend URL here.
// Set INTERNAL_API_URL in .env.local (no NEXT_PUBLIC_ prefix — never exposed
// to the browser). Falls back to NEXT_PUBLIC_API_URL so existing deployments
// don't break without the new var, but you should set it explicitly.
export const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";