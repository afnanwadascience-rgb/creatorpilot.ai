"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/analyze", label: "Analyze" },
  { href: "/dashboard/history", label: "History" },
  { href: "/dashboard/account", label: "Account" },
];

export function Navbar() {
  const activePath = usePathname();
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          CreatorPilot AI
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map((link) => {
            const isActive =
              link.href === "/dashboard"
                ? activePath === "/dashboard"
                : activePath.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-surface text-white" : "text-muted hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/api/auth/logout"
            className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:text-white"
          >
            Log out
          </Link>
        </nav>
      </div>
    </header>
  );
}
