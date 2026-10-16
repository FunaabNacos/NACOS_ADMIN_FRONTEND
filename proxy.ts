import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "nacos_session";

const DASHBOARD_EXCLUDED_SEGMENTS = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/finance-director",
  "/api",
];

const REDIRECT_IF_AUTHED_SEGMENTS = ["/login", "/forgot-password"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  const isDashboardRoute = !DASHBOARD_EXCLUDED_SEGMENTS.some(
    (segment) => pathname === segment || pathname.startsWith(`${segment}/`)
  );
  const isAuthRoute = REDIRECT_IF_AUTHED_SEGMENTS.some(
    (segment) => pathname === segment || pathname.startsWith(`${segment}/`)
  );

  if (isDashboardRoute && !hasSession) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
