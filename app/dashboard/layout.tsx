import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { Navbar } from "@/components/Navbar";

// Every /dashboard/* route passes through here. This is the real,
// server-side authentication check — middleware.ts is only a fast
// redirect-if-no-cookie shortcut; this is what actually resolves and
// validates the session against the database on every request.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/api/auth/login?next=/dashboard");
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
