"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Entitlement } from "@/lib/entitlement";
import type { AnalysisResult } from "@/types/analysis";
import { AnalysisResults } from "@/components/AnalysisResults";

const MAX_CHARS = 20000;

type ApiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; result: AnalysisResult; id: string };

export function AnalyzeClient({ initialEntitlement }: { initialEntitlement: Entitlement }) {
  const [script, setScript] = useState("");
  const [state, setState] = useState<ApiState>({ status: "idle" });
  const [entitlement, setEntitlement] = useState(initialEntitlement);

  const wordCount = useMemo(
    () => (script.trim().length ? script.trim().split(/\s+/).length : 0),
    [script]
  );
  const charCount = script.length;

  const canSubmit =
    entitlement.canAnalyze &&
    charCount >= 50 &&
    charCount <= MAX_CHARS &&
    state.status !== "loading";

  async function handleAnalyze() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "Something went wrong. Please try again." });
        if (data.entitlement) setEntitlement(data.entitlement);
        return;
      }

      setState({ status: "success", result: data.analysis.result, id: data.analysis.id });
      setEntitlement((prev) =>
        prev.hasProAccess
          ? prev
          : {
              ...prev,
              analysesUsed: prev.analysesUsed + 1,
              analysesRemaining: Math.max(0, (prev.analysesRemaining ?? 1) - 1),
              canAnalyze: (prev.analysesRemaining ?? 1) - 1 > 0,
            }
      );
    } catch {
      setState({ status: "error", message: "We couldn&apos;t analyze this script right now. Please try again." });
    }
  }

  function handleClear() {
    setScript("");
    setState({ status: "idle" });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <div className="card">
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Paste your YouTube script here..."
            rows={18}
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-white placeholder:text-muted focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
            <span>
              {wordCount} words · {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
            </span>
            <button onClick={handleClear} className="text-muted hover:text-white">
              Clear
            </button>
          </div>
        </div>

        {!entitlement.canAnalyze && (
          <div className="card mt-4 border-primary/50">
            <p className="text-sm text-white">You&apos;ve used all 10 free analyses.</p>
            <Link href="/dashboard/account" className="btn-primary mt-3">
              Upgrade to Pro
            </Link>
          </div>
        )}

        <button onClick={handleAnalyze} disabled={!canSubmit} className="btn-primary mt-4 w-full">
          {state.status === "loading" ? "Analyzing your script..." : "Analyze Script"}
        </button>

        {state.status === "error" && (
          <p className="mt-3 text-sm text-red-400">{state.message}</p>
        )}

        {!entitlement.hasProAccess && (
          <p className="mt-3 text-center text-xs text-muted">
            {entitlement.analysesRemaining} free analyses remaining
          </p>
        )}
      </div>

      <div>
        {state.status === "idle" && (
          <div className="card flex h-full min-h-[300px] items-center justify-center text-center text-sm text-muted">
            Your analysis will appear here.
          </div>
        )}
        {state.status === "loading" && (
          <div className="card flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted">Analyzing your script...</p>
          </div>
        )}
        {state.status === "success" && <AnalysisResults result={state.result} />}
      </div>
    </div>
  );
}


