import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function base64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "/dashboard";

  const clientId = process.env.WHOP_CLIENT_ID;
  const redirectUri = process.env.WHOP_OAUTH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        error:
          "WHOP_CLIENT_ID or WHOP_OAUTH_REDIRECT_URI is not configured.",
      },
      { status: 500 }
    );
  }

  const codeVerifier = base64Url(crypto.randomBytes(32));

  const codeChallenge = base64Url(
    crypto.createHash("sha256").update(codeVerifier).digest()
  );

  const state = base64Url(crypto.randomBytes(16));
  const nonce = base64Url(crypto.randomBytes(16));

  const authorizeUrl = new URL("https://api.whop.com/oauth/authorize");

  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid profile email");
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("nonce", nonce);

  const safeNext =
    next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/dashboard";

  const response = NextResponse.redirect(authorizeUrl.toString());

  response.cookies.set(
    `oauth-state.${state}`,
    JSON.stringify({
      codeVerifier,
      next: safeNext,
    }),
    {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
    }
  );

  return response;
}
