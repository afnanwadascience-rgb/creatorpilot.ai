import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import { syncWhopProfile } from "@/lib/current-user";

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};

type WhopProfile = {
  sub: string;
  name?: string;
  preferred_username?: string;
  username?: string;
  picture?: string;
  email?: string;
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? url.origin;

  if (!code) {
    return NextResponse.redirect(
      new URL("/oauth/error?error=missing_code", appUrl)
    );
  }

  if (!state) {
    return NextResponse.redirect(
      new URL("/oauth/error?error=missing_state", appUrl)
    );
  }

  const stateCookie = request.cookies.get(`oauth-state.${state}`);

  if (!stateCookie) {
    return NextResponse.redirect(
      new URL("/oauth/error?error=invalid_state", appUrl)
    );
  }

  let oauthState: {
    codeVerifier: string;
    next: string;
  };

  try {
    oauthState = JSON.parse(stateCookie.value);
  } catch {
    return NextResponse.redirect(
      new URL("/oauth/error?error=invalid_state", appUrl)
    );
  }

  const clientId = process.env.WHOP_CLIENT_ID;
  const clientSecret = process.env.WHOP_CLIENT_SECRET;
  const redirectUri = process.env.WHOP_OAUTH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.redirect(
      new URL("/oauth/error?error=server_misconfigured", appUrl)
    );
  }

  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: oauthState.codeVerifier,
  });

  if (clientSecret) {
    tokenBody.set("client_secret", clientSecret);
  }

  const tokenResponse = await fetch(
    "https://api.whop.com/oauth/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenBody.toString(),
    }
  );

  if (!tokenResponse.ok) {
    console.error(
      "Whop token exchange failed:",
      await tokenResponse.text()
    );

    return NextResponse.redirect(
      new URL("/oauth/error?error=code_exchange_failed", appUrl)
    );
  }

  const tokens =
    (await tokenResponse.json()) as TokenResponse;

  if (!tokens.access_token) {
    return NextResponse.redirect(
      new URL("/oauth/error?error=missing_access_token", appUrl)
    );
  }

  const userInfoResponse = await fetch(
    "https://api.whop.com/oauth/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    }
  );

  if (!userInfoResponse.ok) {
    console.error(
      "Whop userinfo failed:",
      await userInfoResponse.text()
    );

    return NextResponse.redirect(
      new URL("/oauth/error?error=userinfo_failed", appUrl)
    );
  }

  const profile =
    (await userInfoResponse.json()) as WhopProfile;

  const whopUserId = profile.sub;

  if (!whopUserId) {
    return NextResponse.redirect(
      new URL("/oauth/error?error=missing_user_id", appUrl)
    );
  }

  await prisma.user.upsert({
    where: {
      whopUserId,
    },
    update: {},
    create: {
      whopUserId,
      usage: {
        create: {
          analysisCount: 0,
        },
      },
    },
  });

  await setSessionCookie({
    whopUserId,
    email: profile.email,
    username:
      profile.preferred_username ??
      profile.username ??
      profile.name,
    avatarUrl: profile.picture,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? "",
    expiresAt:
      Date.now() + (tokens.expires_in ?? 3600) * 1000,
  });

  void syncWhopProfile(
    tokens.access_token,
    whopUserId
  );

  const nextUrl = new URL(
    oauthState.next.startsWith("/")
      ? oauthState.next
      : "/dashboard",
    appUrl
  );

  const response = NextResponse.redirect(nextUrl);

  response.cookies.delete(`oauth-state.${state}`);

  return response;
}
