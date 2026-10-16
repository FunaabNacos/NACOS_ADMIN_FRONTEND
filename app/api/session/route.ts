import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "@/lib/session";
import { INTERNAL_API_URL } from "@/lib/api/config";
import type { AuthUser, ApiSuccess } from "@/lib/types";

async function tryRefreshSession(): Promise<{ accessToken: string; user: AuthUser } | null> {
  if (!INTERNAL_API_URL) return null;

  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;
    if (!refreshToken) return null;

    const refreshRes = await fetch(`${INTERNAL_API_URL}/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `refreshToken=${refreshToken}` },
      cache: "no-store",
    });

    if (!refreshRes.ok) return null;

    const refreshJson = (await refreshRes.json()) as ApiSuccess<{ accessToken: string }>;
    const newAccessToken = refreshJson.data.accessToken;

    // Fetch the user record with the fresh token.
    const meRes = await fetch(`${INTERNAL_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${newAccessToken}` },
      cache: "no-store",
    });

    if (!meRes.ok) return null;

    const meJson = (await meRes.json()) as ApiSuccess<AuthUser>;
    const user = meJson.data;

    const session = await getServerSession();
    session.accessToken = newAccessToken;
    session.user = user;
    await session.save();

    return { accessToken: newAccessToken, user };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { accessToken?: string; user?: AuthUser };

  if (!body.accessToken || !body.user) {
    return NextResponse.json(
      { success: false, message: "accessToken and user are required" },
      { status: 400 }
    );
  }

  const session = await getServerSession();
  session.accessToken = body.accessToken;
  session.user = body.user;
  await session.save();

  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getServerSession();

  // Fast path — session cookie is valid and populated.
  if (session.user && session.accessToken) {
    return NextResponse.json({
      success: true,
      data: { user: session.user, accessToken: session.accessToken },
    });
  }
  const refreshed = await tryRefreshSession();
  if (refreshed) {
    return NextResponse.json({
      success: true,
      data: { user: refreshed.user, accessToken: refreshed.accessToken },
    });
  }

  return NextResponse.json({ success: true, data: { user: null, accessToken: null } });
}

export async function DELETE() {
  const session = await getServerSession();
  session.destroy();
  return NextResponse.json({ success: true });
}