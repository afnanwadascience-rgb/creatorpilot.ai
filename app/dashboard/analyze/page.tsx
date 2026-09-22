import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getEntitlement } from "@/lib/entitlement";
import { AnalyzeClient } from "./analyze-client";

export default async function AnalyzePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/login?next=/dashboard/analyze");

  const entitlement = await getEntitlement(user.id, user.whopUserId);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Analyze a Script</h1>
      <p className="mt-1 text-sm text-muted">
        Paste your full YouTube script below. CreatorPilot AI will score its hook,
        structure, retention, and clarity.
      </p>
      <div className="mt-8">
        <AnalyzeClient initialEntitlement={entitlement} />
      </div>
    </div>
  );
}
