import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AnalysisResultSchema } from "@/types/analysis";
import { AnalysisResults } from "@/components/AnalysisResults";

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/login?next=/dashboard/history");

  const { id } = await params;

  // Ownership check happens in the query itself (userId: user.id), never
  // trusting the id alone — a user can&apos;t view someone else&apos;s analysis by
  // guessing or changing the URL.
  const analysis = await prisma.analysis.findFirst({
    where: { id, userId: user.id },
  });

  if (!analysis) {
    notFound();
  }

  const parsedResult = AnalysisResultSchema.safeParse(analysis.result);
  if (!parsedResult.success) {
    // Defensive: if a historical record&apos;s stored JSON somehow doesn&apos;t match
    // the current schema, don&apos;t crash the page.
    return (
      <div className="card text-center text-sm text-muted">
        This analysis record couldn&apos;t be displayed.
      </div>
    );
  }

  return (
    <div>
      <Link href="/dashboard/history" className="text-sm text-muted hover:text-white">
        ← Back to history
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">{analysis.title}</h1>
      <p className="mt-1 text-sm text-muted">
        Analyzed {new Date(analysis.createdAt).toLocaleString()}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="card">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
            Script
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {analysis.script}
          </p>
        </div>
        <AnalysisResults result={parsedResult.data} />
      </div>
    </div>
  );
}

