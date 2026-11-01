"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

const QUICK_LINKS = [
  {
    href: "/me/reviews",
    icon: "⭐",
    title: "My reviews",
    body: "See and manage the reviews you've written.",
  },
  {
    href: "/me/settings",
    icon: "⚙️",
    title: "Settings",
    body: "Update your profile and change your password.",
  },
  {
    href: "/tours",
    icon: "🧭",
    title: "Browse tours",
    body: "Find your next adventure.",
  },
];

export default function MePage() {
  const { user, isLoading, isAdmin } = useAuth();

  const initial = (user?.name || user?.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        {/* ============================ HERO ============================ */}
        <section className="relative overflow-hidden bg-linear-to-br from-emerald-50 via-white to-sky-50">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl"
          />

          <div className="relative mx-auto max-w-5xl px-6 py-12 sm:py-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-800 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Your account
            </span>

            {isLoading || !user ? (
              <div className="mt-6 flex items-center gap-5" aria-busy="true">
                <div className="h-20 w-20 animate-pulse rounded-full bg-gray-200" />
                <div className="space-y-3">
                  <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap items-center gap-5">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-sky-500 text-3xl font-bold text-white shadow-md">
                  {initial}
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                    Welcome back,{" "}
                    <span className="bg-linear-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
                      {user.name?.split(" ")[0] || "traveler"}
                    </span>
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage your profile, reviews, and preferences
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============================ CONTENT ============================ */}
        <div className="mx-auto max-w-5xl px-6 py-12">
          {isLoading || !user ? (
            <div className="grid gap-6 md:grid-cols-3" aria-busy="true">
              <div className="h-56 animate-pulse rounded-2xl border border-gray-200 bg-white shadow-sm md:col-span-2" />
              <div className="h-56 animate-pulse rounded-2xl border border-gray-200 bg-white shadow-sm" />
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Profile card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Profile
                    </h2>
                    <Link
                      href="/me/settings"
                      className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Edit →
                    </Link>
                  </div>

                  <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Name
                      </dt>
                      <dd className="mt-1 text-sm text-gray-800">
                        {user.name || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Email
                      </dt>
                      <dd className="mt-1 break-all text-sm text-gray-800">
                        {user.email || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Role
                      </dt>
                      <dd className="mt-1">
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-emerald-800">
                          {user.role || "—"}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Member since
                      </dt>
                      <dd className="mt-1 text-sm text-gray-800">
                        {memberSince}
                      </dd>
                    </div>
                    {user.phone && (
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Phone
                        </dt>
                        <dd className="mt-1 text-sm text-gray-800">
                          {user.phone}
                        </dd>
                      </div>
                    )}
                    {user.bio && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Bio
                        </dt>
                        <dd className="mt-1 text-sm text-pretty text-gray-800">
                          {user.bio}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Admin / status card */}
                <aside className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Account
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {isAdmin
                        ? "You have administrator access."
                        : "Your account is in good standing."}
                    </p>
                  </div>

                  {isAdmin ? (
                    <Link
                      href="/admin"
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-emerald-700/30"
                    >
                      🛡️ Admin panel
                    </Link>
                  ) : (
                    <Link
                      href="/tours"
                      className="mt-6 inline-flex items-center justify-center rounded-xl border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                    >
                      Browse tours
                    </Link>
                  )}
                </aside>
              </div>

              {/* Quick links */}
              <h2 className="mt-12 text-xl font-bold text-gray-900">
                Quick links
              </h2>
              <div className="mt-4 grid gap-6 md:grid-cols-3">
                {QUICK_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                  >
                    <div
                      aria-hidden
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-xl"
                    >
                      {l.icon}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-emerald-800">
                      {l.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">{l.body}</p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
