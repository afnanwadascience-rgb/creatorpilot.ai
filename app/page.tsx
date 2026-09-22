import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";

const FEATURES = [
  {
    title: "Hook Analysis",
    desc: "Scores the first 30 seconds for curiosity, stakes, and whether viewers have a reason to stay.",
  },
  {
    title: "Retention Analysis",
    desc: "Flags likely drop-off points, pacing issues, and missing curiosity loops across the full script.",
  },
  {
    title: "Script Structure",
    desc: "Checks intro, main sections, transitions, and conclusion for logical flow.",
  },
  {
    title: "Title Ideas",
    desc: "Generates title options grounded in what your script is actually about.",
  },
  {
    title: "Thumbnail Ideas",
    desc: "Concrete visual concepts to pair with your strongest hook.",
  },
  {
    title: "AI Recommendations",
    desc: "Specific, actionable edits — not generic advice.",
  },
];

const STEPS = [
  { n: "1", title: "Paste your script", desc: "Drop in your YouTube script, no formatting required." },
  { n: "2", title: "Analyze it with AI", desc: "CreatorPilot scores hooks, retention, structure, and clarity." },
  { n: "3", title: "Improve your content", desc: "Apply specific suggestions before you hit record." },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight">CreatorPilot AI</span>
        <Link href="/api/auth/login?next=/dashboard" className="btn-secondary">
          Sign in with Whop
        </Link>
      </nav>

      <section className="mx-auto max-w-4xl px-6 pt-16 pb-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Create Better YouTube Scripts With AI
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
          Analyze your script for hooks, retention, structure, clarity, and audience
          engagement.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/api/auth/login?next=/dashboard" className="btn-primary">
            Start Analyzing Free
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted">10 free AI analyses. No credit card required.</p>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold">How It Works</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n} className="text-center">
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border text-sm font-medium">
                {step.n}
              </div>
              <h3 className="font-medium">{step.title}</h3>
              <p className="mt-2 text-sm text-muted">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold">Everything you need to ship a better script</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold">Pricing</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="card">
            <h3 className="text-lg font-medium">Free</h3>
            <p className="mt-1 text-3xl font-semibold">$0</p>
            <p className="mt-2 text-sm text-muted">10 script analyses, full feature access.</p>
            <Link href="/api/auth/login?next=/dashboard" className="btn-secondary mt-6 w-full">
              Start Free
            </Link>
          </div>
          <div className="card border-primary/50">
            <h3 className="text-lg font-medium">Pro</h3>
            <p className="mt-1 text-3xl font-semibold">Paid through Whop</p>
            <p className="mt-2 text-sm text-muted">
              Unlimited analyses. Available as a Whop product from this app's listing.
            </p>
            <Link href="/api/auth/login?next=/dashboard" className="btn-secondary mt-6 w-full">
              Sign in to upgrade
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-xs text-muted">
        CreatorPilot AI analysis is AI-generated guidance, not an objective measurement.
      </footer>
    </main>
  );
}
