import type { AnalysisResult } from "@/types/analysis";

function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="card py-4 text-center">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{score}</p>
      <p className="text-xs text-muted">/100</p>
    </div>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="text-sm font-medium text-white">{title}</h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted">
            <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AnalysisResults({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-6">
      <div className="card text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Overall Score · AI-generated analysis
        </p>
        <p className="mt-1 text-4xl font-semibold text-primary">{result.overallScore}/100</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ScoreCard label="Hook" score={result.hookScore} />
        <ScoreCard label="Retention" score={result.retentionScore} />
        <ScoreCard label="Structure" score={result.structureScore} />
        <ScoreCard label="Clarity" score={result.clarityScore} />
      </div>

      <div className="card space-y-5">
        <ListSection title="Strengths" items={result.strengths} />
        <ListSection title="Weaknesses" items={result.weaknesses} />
        <ListSection title="Retention Risks" items={result.retentionRisks} />
        <ListSection title="Hook Improvements" items={result.hookSuggestions} />
        <ListSection title="Title Ideas" items={result.titleSuggestions} />
        <ListSection title="Thumbnail Ideas" items={result.thumbnailIdeas} />
        <ListSection title="CTA Suggestions" items={result.ctaSuggestions} />
        <ListSection title="Improvements" items={result.improvements} />
      </div>
    </div>
  );
}
