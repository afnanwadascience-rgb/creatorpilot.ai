import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getEntitlement } from "@/lib/entitlement";
import { prisma } from "@/lib/prisma";
import { UsageCard } from "@/components/UsageCard";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/login?next=/dashboard");

  const [entitlement, recentAnalyses] = await Promise.all([
    getEntitlement(user.id, user.whopUserId),
    prisma.analysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, overallScore: true, createdAt: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">
        Welcome back{user.username ? `, ${user.username}` : ", Creator"}
      </h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <UsageCard entitlement={entitlement} />
        <div className="card flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-muted">Get started</p>
            <p className="mt-1 text-lg font-medium">Analyze a script</p>
            <p className="mt-2 text-sm text-muted">
              Paste a YouTube script and get a full breakdown of its hook, structure, and
              retention.
            </p>
          </div>
          <Link href="/dashboard/analyze" className="btn-primary mt-6">
            Analyze a Script
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent analyses</h2>
          {recentAnalyses.length > 0 && (
            <Link href="/dashboard/history" className="text-sm text-primary hover:underline">
              View all
            </Link>
          )}
        </div>

        {recentAnalyses.length === 0 ? (
          <div className="card mt-4 text-center text-sm text-muted">
            No analyses yet. Run your first one above.
          </div>
        ) : (
          <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
            {recentAnalyses.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/history/${a.id}`}
                className="flex items-center justify-between bg-surface px-5 py-4 transition hover:bg-surfaceHover"
              >
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary">
                  {a.overallScore}/100
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
