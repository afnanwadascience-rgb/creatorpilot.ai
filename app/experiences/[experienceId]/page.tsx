import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { whopApi } from "@/lib/whop-sdk";
import { prisma } from "@/lib/prisma";

// This route is what you'd set as the "Experience View" path in the Whop
// developer dashboard's Hosting settings if you want CreatorPilot to open
// directly inside the Whop sidebar as an installed Experience.
//
// Inside that context, Whop attaches a verified x-whop-user-token header
// to every request — no OAuth redirect needed. We verify it, confirm the
// user has access to this specific experience, create the local user row
// if needed, and then hand off to the normal dashboard.
export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  const headersList = await headers();

  const { userId } = await whopApi.verifyUserToken(headersList);

  const access = await whopApi.users.checkAccess({
    id: userId,
    resource_id: experienceId,
  });

  if (!access.has_access) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <p className="text-sm text-muted">
          You don't have access to CreatorPilot AI through this community.
        </p>
      </div>
    );
  }

  await prisma.user.upsert({
    where: { whopUserId: userId },
    update: {},
    create: {
      whopUserId: userId,
      usage: { create: { analysisCount: 0 } },
    },
  });

  // Note: this route establishes DB identity but not the encrypted OAuth
  // session cookie the rest of /dashboard relies on (that requires an
  // access_token from the OAuth flow, which iframe tokens don't provide).
  // If you enable the Experience View, wire a lightweight iframe-only
  // session here, or keep directing users through /api/auth/login as the
  // primary entry point — the free plan and history stay correct either
  // way since both paths key off the same whopUserId.
  redirect("/dashboard");
}
