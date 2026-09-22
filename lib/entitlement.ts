import { whopAppClient } from "@/lib/whop-sdk";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export const FREE_ANALYSIS_LIMIT = 10;

export type PlanTier = "free" | "pro";

export interface Entitlement {
  plan: PlanTier;
  hasProAccess: boolean;
  analysisLimit: number | null;
  canAnalyze: boolean;
  message: string | null;
}

export async function hasProAccess(user: User): Promise<boolean> {
  const productId = process.env.WHOP_PRODUCT_ID;

  if (!productId) {
    return false;
  }

  try {
    const client = whopAppClient();

    const access = await client.users.checkAccess(productId, {
      id: user.whopUserId,
    });

    return Boolean(access?.has_access);
  } catch (error) {
    console.error("Whop entitlement check failed:", error);

    // Never grant Pro access if the Whop check fails.
    return false;
  }
}

export async function getUserEntitlement(
  user: User
): Promise<Entitlement> {
  const pro = await hasProAccess(user);

  if (pro) {
    return {
      plan: "pro",
      hasProAccess: true,
      analysisLimit: null,
      canAnalyze: true,
      message: null,
    };
  }

  const usage = await prisma.usage.findUnique({
    where: {
      userId: user.id,
    },
  });

  const analysisCount = usage?.analysisCount ?? 0;

  const remaining = Math.max(
    0,
    FREE_ANALYSIS_LIMIT - analysisCount
  );

  return {
    plan: "free",
    hasProAccess: false,
    analysisLimit: FREE_ANALYSIS_LIMIT,
    canAnalyze: remaining > 0,
    message:
      remaining > 0
        ? null
        : "You've used all 10 free analyses. Buy Pro to continue.",
  };
}

/**
 * Backwards-compatible helper used by the analysis API.
 */
export async function getEntitlement(
  userId: string,
  _whopUserId: string
): Promise<Entitlement> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return {
      plan: "free",
      hasProAccess: false,
      analysisLimit: FREE_ANALYSIS_LIMIT,
      canAnalyze: false,
      message: "User not found.",
    };
  }

  return getUserEntitlement(user);
}
