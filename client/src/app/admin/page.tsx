"use client";

import Link from "next/link";
import { useAdminStats } from "@/hooks/useAdmin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge, PageHeader } from "@/components/admin/ui";

function Tile({
  icon,
  label,
  value,
  href,
  hint,
}: {
  icon: string;
  label: string;
  value: string | number;
  href: string;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
    >
      <span aria-hidden className="text-xl">
        {icon}
      </span>
      <div className="mt-2 text-2xl font-extrabold text-gray-900">{value}</div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      {hint && <div className="mt-1 text-xs text-amber-700">{hint}</div>}
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { data: s, isLoading, isError, refetch } = useAdminStats();

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of everything on the platform"
      />

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {isError && (
        <button
          onClick={() => refetch()}
          className="text-sm font-semibold text-emerald-700"
        >
          Couldn&apos;t load stats — try again
        </button>
      )}

      {s && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile
              icon="🧭"
              label="Active tours"
              value={s.tours.active}
              href="/admin/tours"
              hint={s.tours.trashed ? `${s.tours.trashed} in trash` : undefined}
            />
            <Tile icon="👥" label="Users" value={s.users} href="/admin/users" />
            <Tile
              icon="🎟️"
              label="Bookings"
              value={s.bookings.total}
              href="/admin/bookings"
              hint={
                s.bookings.byStatus.pending
                  ? `${s.bookings.byStatus.pending} pending`
                  : undefined
              }
            />
            <Tile
              icon="💰"
              label="Paid revenue"
              value={formatCurrency(s.bookings.revenue)}
              href="/admin/bookings"
            />
            <Tile
              icon="⭐"
              label="Live reviews"
              value={s.reviews.approved}
              href="/admin/reviews"
              hint={
                s.reviews.reported
                  ? `${s.reviews.reported} reported`
                  : undefined
              }
            />
            <Tile
              icon="🚫"
              label="Removed reviews"
              value={s.reviews.removed}
              href="/admin/reviews"
            />
          </div>

          <h2 className="mt-10 mb-3 text-lg font-bold text-gray-900">
            Recent bookings
          </h2>
          <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white shadow-sm">
            {s.recentBookings.length === 0 && (
              <p className="p-6 text-sm text-gray-500">No bookings yet.</p>
            )}
            {s.recentBookings.map((b) => (
              <div
                key={b._id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    {b.tour?.name ?? "Deleted tour"}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {b.user?.name ?? "Unknown"} · {formatDate(b.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-700">
                    {formatCurrency(b.price)}
                  </span>
                  <Badge
                    tone={
                      b.status === "confirmed"
                        ? "green"
                        : b.status === "pending"
                          ? "amber"
                          : b.status === "cancelled"
                            ? "red"
                            : "gray"
                    }
                  >
                    {b.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
