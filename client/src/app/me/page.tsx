"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function MePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Your account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your profile, reviews, and preferences
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {/* Profile card */}
          <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>

            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">
                  Name
                </dt>
                <dd className="mt-1 text-sm text-gray-800">{user.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">
                  Email
                </dt>
                <dd className="mt-1 text-sm text-gray-800">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">
                  Role
                </dt>
                <dd className="mt-1 text-sm capitalize text-gray-800">
                  {user.role}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">
                  Member since
                </dt>
                <dd className="mt-1 text-sm text-gray-800">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "—"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick actions */}
          <aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Quick links</h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  href="/me/reviews"
                  className="block rounded-lg px-3 py-2 text-gray-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  ⭐ My reviews
                </Link>
              </li>
              <li>
                <Link
                  href="/me/settings"
                  className="block rounded-lg px-3 py-2 text-gray-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  ⚙️ Settings
                </Link>
              </li>
              <li>
                <Link
                  href="/tours"
                  className="block rounded-lg px-3 py-2 text-gray-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  🧭 Browse tours
                </Link>
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </ProtectedRoute>
  );
}
