import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export const FREE_ANALYSIS_LIMIT = 10;

export type PlanTier = "free" | "pro";

export interface Entitlement {
  plan: PlanTier;
  hasProAccess: boolean;

  limit: number | null;
  analysisLimit: number | null;

  analysesUsed: number;
  analysesRemaining: number | null;

  canAnalyze: boolean;
  message: string | null;
}

export async function hasProAccess(user: User): Promise<boolean> {
  /*
   * Whop Pro access checking will be connected after
   * the remaining Whop membership integration is finalized.
   */
  return false;
}

export async function getUserEntitlement(
  user: User
): Promise<Entitlement> {
  const pro = await hasProAccess(user);

  if (pro) {
    return {
      plan: "pro",
      hasProAccess: true,
      limit: null,
      analysisLimit: null,
      analysesUsed: 0,
      analysesRemaining: null,
      canAnalyze: true,
      message: null,
    };
  }

  const usage = await prisma.usage.findUnique({
    where: { userId: user.id },
  });

  const analysesUsed = usage?.analysisCount ?? 0;
  const analysesRemaining = Math.max(
    0,
    FREE_ANALYSIS_LIMIT - analysesUsed
  );

  return {
    plan: "free",
    hasProAccess: false,
    limit: FREE_ANALYSIS_LIMIT,
    analysisLimit: FREE_ANALYSIS_LIMIT,
    analysesUsed,
    analysesRemaining,
    canAnalyze: analysesRemaining > 0,
    message:
      analysesRemaining > 0
        ? null
        : "You've used all 10 free analyses. Buy Pro to continue.",
  };
}

export async function getEntitlement(
  userId: string,
  _whopUserId: string
): Promise<Entitlement> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return {
      plan: "free",
      hasProAccess: false,
      limit: FREE_ANALYSIS_LIMIT,
      analysisLimit: FREE_ANALYSIS_LIMIT,
      analysesUsed: 0,
      analysesRemaining: 0,
      canAnalyze: false,
      message: "User not found.",
    };
  }

  return getUserEntitlement(user);
}
