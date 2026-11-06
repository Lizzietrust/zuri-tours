"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AdminShell from "@/components/admin/AdminShell";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200/70 ${className}`} />
  );
}

function AdminLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-screen bg-gray-50"
    >
      {/* Sidebar skeleton */}
      <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-gray-200 bg-white p-5 lg:flex">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl bg-emerald-100" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-8">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="mt-3 h-7 w-20" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Centered status pill */}
      <div className="pointer-events-none fixed inset-x-0 bottom-8 flex justify-center">
        <div className="flex items-center gap-3 rounded-full border border-emerald-100 bg-white px-5 py-2.5 shadow-lg">
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600"
          />
          <span className="text-sm font-medium text-gray-700">
            Checking access…
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading, isAdmin } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/login?redirect=/admin");
    else if (!isAdmin) router.replace("/me");
  }, [isLoading, user, isAdmin, router]);

  if (isLoading || !user || !isAdmin) {
    return <AdminLoading />;
  }

  return <AdminShell>{children}</AdminShell>;
}
