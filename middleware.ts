import { NextRequest, NextResponse } from "next/server";

// This is a fast, cheap first line of defense: if there's no session
// cookie at all, bounce to login immediately without hitting the DB.
// It intentionally does NOT decrypt/validate the session (middleware runs
// on the edge and iron-session's Node crypto isn't edge-safe here) — every
// dashboard page and API route independently calls getCurrentUser() /
// getSession() server-side and re-checks properly. Middleware is a UX
// shortcut, not the security boundary.
export function middleware(request: NextRequest) {
  const hasSessionCookie = request.cookies.has("creatorpilot_session");

  if (!hasSessionCookie) {
    const loginUrl = new URL("/api/auth/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
