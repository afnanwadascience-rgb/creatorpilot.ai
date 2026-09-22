import { EncryptJWT, jwtDecrypt } from "jose";
import { createHash } from "crypto";
import { cookies } from "next/headers";

/**
 * Encrypted, httpOnly session cookie for CreatorPilot AI.
 *
 * We never store raw Whop tokens in a client-readable cookie. Instead the
 * whole session payload (Whop user id + OAuth tokens) is encrypted with
 * A256GCM (JWE) using a server-only secret, then placed in an httpOnly,
 * Secure, SameSite=Lax cookie. The browser can carry the cookie but cannot
 * read or forge its contents.
 */

export const SESSION_COOKIE_NAME = "creatorpilot_session";

export interface SessionPayload {
  whopUserId: string; // "sub" from Whop OIDC userinfo, e.g. user_xxxxx
  email?: string;
  username?: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms when the access token expires
  [key: string]: unknown; // satisfies jose's JWTPayload index signature
}

function getEncryptionKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Set a strong random value (32+ chars) in your environment."
    );
  }
  // Normalize any provided secret to a 32-byte key for A256GCM.
  return createHash("sha256").update(secret).digest();
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  const key = getEncryptionKey();
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .encrypt(key);
}

export async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const key = getEncryptionKey();
    const { payload } = await jwtDecrypt(token, key);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const jwe = await encryptSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, jwe, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;
  return decryptSession(raw);
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
