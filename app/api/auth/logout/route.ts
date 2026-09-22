import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

// GET /api/auth/logout
// Destroys the local encrypted session. Access tokens are short-lived
// (~1hr) and cannot be server-revoked by design (Whop OAuth), so we only
// destroy our own session here — the token simply expires on its own.
export async function GET(request: NextRequest) {
  const session = await getSession();
  session.destroy();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  return NextResponse.redirect(new URL("/", appUrl));
}
