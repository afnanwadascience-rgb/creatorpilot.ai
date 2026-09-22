import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import type { User } from "@prisma/client";

/**
 * Resolves the signed-in Whop user (from the encrypted session cookie) to
 * a local database row, creating it on first sign-in. Returns null if
 * nobody is signed in. This is the only function route handlers and
 * server components should use to find "who is making this request" —
 * it never trusts anything the client sent in the request body/query.
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSessionFromCookies();
  if (!session || !session.whopUserId || !session.accessToken) return null;

  // Access tokens are short-lived (~1hr). If it's expired, treat the user
  // as signed out rather than trusting a stale identity.
  if (session.expiresAt && Date.now() > session.expiresAt) {
    return null;
  }

  const user = await prisma.user.upsert({
    where: { whopUserId: session.whopUserId },
    update: {},
    create: {
      whopUserId: session.whopUserId,
      usage: { create: { analysisCount: 0 } },
    },
  });

  return user;
}

/**
 * Fetches the user's Whop profile (username/email/avatar) using their
 * OAuth access token and syncs it onto the local User row. Best-effort:
 * failures here should never block the rest of the app.
 */
export async function syncWhopProfile(accessToken: string, whopUserId: string) {
  try {
    const res = await fetch("https://api.whop.com/oauth/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return;
    const profile = (await res.json()) as {
      sub: string;
      preferred_username?: string;
      name?: string;
      picture?: string;
      email?: string;
    };

    await prisma.user.update({
      where: { whopUserId },
      data: {
        username: profile.preferred_username ?? profile.name ?? undefined,
        avatarUrl: profile.picture ?? undefined,
        email: profile.email ?? undefined,
      },
    });
  } catch (err) {
    console.error("Failed to sync Whop profile", err);
  }
}

/**
 * Convenience wrapper used inside the Whop iframe app context, where the
 * signed-in Whop user is available via the x-whop-user-token header even
 * without going through the OAuth redirect flow (e.g. when CreatorPilot
 * is opened as an installed Experience inside whop.com).
 */
export async function getIframeWhopUserId(headers: Headers): Promise<string | null> {
  try {
    const { userId } = await whopApi.verifyUserToken(headers, { dontThrow: true } as any);
    return userId ?? null;
  } catch {
    return null;
  }
}



