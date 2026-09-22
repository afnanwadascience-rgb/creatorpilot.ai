import Link from "next/link";

const MESSAGES: Record<string, string> = {
  missing_code: "Whop didn't send back an authorization code. Please try signing in again.",
  missing_state: "Your sign-in request expired or was tampered with. Please try again.",
  invalid_state: "We couldn't verify your sign-in request. Please try again.",
  code_exchange_failed: "Unable to sign you in with Whop. Please try again.",
  userinfo_failed: "We signed you in but couldn't load your Whop profile. Please try again.",
  server_misconfigured: "This app isn't configured correctly yet. Please contact the app owner.",
};

export default async function OAuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = (error && MESSAGES[error]) || "Unable to sign you in with Whop. Please try again.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Sign-in failed</h1>
        <p className="mt-3 text-sm text-muted">{message}</p>
        <Link
          href="/api/auth/login"
          className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primaryHover"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
