import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getEntitlement } from "@/lib/entitlement";
import { UsageCard } from "@/components/UsageCard";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/login?next=/dashboard/account");

  const entitlement = await getEntitlement(user.id, user.whopUserId);
  const productId = process.env.WHOP_PRODUCT_ID;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Account</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="card">
          <p className="text-sm font-medium text-muted">Signed in as</p>
          <p className="mt-1 text-lg font-medium">{user.username ?? "Whop user"}</p>
          {user.email && <p className="text-sm text-muted">{user.email}</p>}
          <p className="mt-3 text-xs text-muted">Whop ID: {user.whopUserId}</p>
        </div>

        <UsageCard entitlement={entitlement} />
      </div>

      {!entitlement.hasProAccess && (
        <div className="card mt-6">
          <h2 className="text-lg font-medium">Upgrade to Pro</h2>
          <p className="mt-2 text-sm text-muted">
            Pro unlocks unlimited script analyses. CreatorPilot Pro is sold as a Whop
            product — purchase it from this app&apos;s listing on Whop to unlock it
            automatically here.
          </p>
          {productId ? (
            <a
              href={`https://whop.com/checkout/${productId}`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary mt-4"
            >
              Upgrade on Whop
            </a>
          ) : (
            <p className="mt-4 text-xs text-muted">
              The Pro product isn&apos;t configured yet. Set WHOP_PRODUCT_ID once it&apos;s created.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

