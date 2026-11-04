"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/tours", label: "Tours", icon: "🧭" },
  { href: "/admin/bookings", label: "Bookings", icon: "🎟️" },
  { href: "/admin/reviews", label: "Reviews", icon: "⭐" },
  { href: "/admin/users", label: "Users", icon: "👥" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
        <aside className="mb-6 lg:mb-0">
          <p className="mb-3 hidden text-xs font-semibold uppercase tracking-wide text-gray-400 lg:block">
            Admin panel
          </p>
          <nav
            aria-label="Admin"
            className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible"
          >
            {NAV.map((n) => {
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
              href="/me"
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
