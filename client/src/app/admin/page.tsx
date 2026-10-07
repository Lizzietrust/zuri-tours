"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { adminService } from "@/services/admin";

export default function AdminDashboard() {
  const usersQuery = useQuery({
    queryKey: ["admin", "users", "stats"],
    queryFn: () => adminService.getUsersWithStats(),
  });

  const toursQuery = useQuery({
    queryKey: ["admin", "tours", "stats"],
    queryFn: () => adminService.getAllTours({ limit: 1 }),
  });

  const reviewsQuery = useQuery({
    queryKey: ["admin", "reviews", "pending"],
    queryFn: () => adminService.getAllReviews({ status: "pending", limit: 1 }),
  });

  const stats = [
    {
      label: "Total users",
      value: usersQuery.data?.length ?? "—",
      icon: "👥",
      href: "/admin/users",
    },
    {
      label: "Total tours",
      value: toursQuery.data?.total ?? "—",
      icon: "🧭",
      href: "/admin/tours",
    },
    {
      label: "Pending reviews",
      value: reviewsQuery.data?.total ?? "—",
      icon: "⭐",
      href: "/admin/reviews",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage your platform, users, tours, and reviews.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
          >
            <div className="text-3xl">{s.icon}</div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Quick actions</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link
              href="/admin/tours/new"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-700"
            >
              + New tour
            </Link>
            <Link
              href="/admin/users"
              className="rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Manage users
            </Link>
            <Link
              href="/admin/reviews?status=pending"
              className="rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Moderate reviews
            </Link>
            <Link
              href="/admin/users?role=guide"
              className="rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              View guides
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Recent users</h2>
          <ul className="mt-4 divide-y divide-gray-100">
            {(usersQuery.data ?? []).slice(0, 5).map((u) => (
              <li
                key={u._id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-800">{u.name}</p>
                  <p className="truncate text-gray-500">{u.email}</p>
                </div>
                <span className="ml-2 shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">
                  {u.role}
                </span>
              </li>
            ))}
            {!usersQuery.data?.length && (
              <li className="py-3 text-sm text-gray-500">No users yet.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
