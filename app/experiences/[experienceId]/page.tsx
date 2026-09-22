import { redirect } from "next/navigation";

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  await params;

  redirect("/api/auth/login?next=/dashboard");
}
