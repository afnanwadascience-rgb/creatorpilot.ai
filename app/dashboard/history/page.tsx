import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/login?next=/dashboard/history");

  const analyses = await prisma.analysis.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, overallScore: true, createdAt: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Analysis History</h1>
      <p className="mt-1 text-sm text-muted">Every script you&apos;ve analyzed, most recent first.</p>

      {analyses.length === 0 ? (
        <div className="card mt-8 text-center text-sm text-muted">
          No analyses yet.{" "}
          <Link href="/dashboard/analyze" className="text-primary hover:underline">
            Analyze your first script
          </Link>
          .
        </div>
      ) : (
        <div className="mt-8 divide-y divide-border overflow-hidden rounded-xl border border-border">
          {analyses.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/history/${a.id}`}
              className="flex items-center justify-between bg-surface px-5 py-4 transition hover:bg-surfaceHover"
            >
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-muted">
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </div>
              <span className="text-sm font-semibold text-primary">{a.overallScore}/100</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

