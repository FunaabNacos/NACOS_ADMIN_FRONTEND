import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import type { AuthUser } from "./types";

export interface SessionData {
  accessToken?: string;
  user?: AuthUser;
}

const secret = process.env.SESSION_SECRET;
if (!secret || secret.length < 32) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be set to a random string of at least 32 characters in production."
    );
  }
}

export const sessionOptions: SessionOptions = {
  password: secret ?? "dev-only-insecure-session-secret-please-set-a-real-one",
  cookieName: "nacos_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  },
};

export async function getServerSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/** Returns the current user from the session cookie, or null if not signed in. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getServerSession();
  return session.user ?? null;
}

/** Throws if there's no active session. Use in Server Components that are always behind middleware. */
export async function requireServerAuth(): Promise<{ accessToken: string; user: AuthUser }> {
  const session = await getServerSession();
  if (!session.accessToken || !session.user) {
    throw new Error("No active session");
  }
  return { accessToken: session.accessToken, user: session.user };
}
