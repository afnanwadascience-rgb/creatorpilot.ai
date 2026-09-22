import Link from "next/link";
import type { Entitlement } from "@/lib/entitlement";

export function UsageCard({ entitlement }: { entitlement: Entitlement }) {
  if (entitlement.hasProAccess) {
    return (
      <div className="card">
        <p className="text-sm font-medium text-muted">Plan</p>
        <p className="mt-1 text-2xl font-semibold text-primary">Pro — Unlimited analyses</p>
      </div>
    );
  }

  const { analysesUsed, limit, analysesRemaining, canAnalyze } = entitlement;
  const pct = limit ? Math.min(100, (analysesUsed / limit) * 100) : 0;

  return (
    <div className="card">
      <p className="text-sm font-medium text-muted">Free analyses</p>
      <p className="mt-1 text-2xl font-semibold">
        {analysesUsed} / {limit} used
      </p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surfaceHover">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {canAnalyze ? (
        <p className="mt-3 text-sm text-muted">{analysesRemaining} free analyses remaining</p>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-white">You've used all 10 free analyses.</p>
          <Link href="/dashboard/account" className="btn-primary mt-3">
            Upgrade to Pro
          </Link>
        </div>
      )}
    </div>
  );
}
