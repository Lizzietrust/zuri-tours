"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = { href: string; label: string; icon: string; exact?: boolean };

const BASE_NAV: NavItem[] = [
  { href: "/guide", label: "Overview", icon: "📊", exact: true },
  { href: "/guide/availability", label: "Availability", icon: "📅" },
  { href: "/me", label: "My profile", icon: "🙋", exact: true },
  { href: "/me/settings", label: "Settings", icon: "⚙️" },
];

const LEAD_NAV: NavItem = { href: "/guide/team", label: "Team", icon: "👥" };

export default function GuideShell({
  children,
  isLead,
}: {
  children: ReactNode;
  isLead: boolean;
}) {
  const pathname = usePathname();

  /* Team goes right after Availability for lead guides */
  const nav = isLead
    ? [...BASE_NAV.slice(0, 2), LEAD_NAV, ...BASE_NAV.slice(2)]
    : BASE_NAV;

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside className="mb-6 scrollbar-none lg:sticky lg:top-(--admin-sticky-top) lg:mb-0 lg:max-h-[calc(100vh-var(--admin-sticky-top)-2rem)] lg:self-start lg:overflow-y-auto">
          <p className="mb-3 hidden text-xs font-semibold uppercase tracking-wide text-gray-400 lg:block">
            {isLead ? "Lead guide workspace" : "Guide workspace"}
          </p>

          <nav
            aria-label="Guide"
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-none lg:flex-col lg:overflow-visible"
          >
            {nav.map((n) => {
              const active = n.exact
                ? pathname === n.href
                : pathname.startsWith(n.href);

              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-800"
                  }`}
                >
                  <span aria-hidden>{n.icon}</span>
                  {n.label}
                </Link>
              );
            })}

            <Link
              href="/tours"
              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 lg:mt-4"
            >
              ← Back to site
            </Link>
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
