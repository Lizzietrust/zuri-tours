"use client";

import { useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MyReviewCard from "@/components/reviews/MyReviewCard";
import { useMyReviews } from "@/hooks/useReviews";

const LIMIT = 5;

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Most recent" },
  { value: "createdAt", label: "Oldest" },
  { value: "-rating", label: "Highest rated" },
  { value: "rating", label: "Lowest rated" },
  { value: "-helpfulCount", label: "Most helpful" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "approved", label: "Approved" },
  { value: "flagged", label: "Flagged" },
  { value: "rejected", label: "Rejected" },
  { value: "hidden", label: "Hidden" },
];

const SELECT_CLASS =
  "rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100";

const PAGE_BTN =
  "rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-white";

export default function MyReviewsPage() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("-createdAt");
  const [status, setStatus] = useState("all");

  const { data, isLoading, isError, error, isFetching, refetch } = useMyReviews(
    {
      page,
      limit: LIMIT,
      sort,
      status: status === "all" ? undefined : status,
    },
  );

  const reviews = data?.reviews ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 0;
  const isFiltered = status !== "all";

  const handleDeleted = () => {
    if (reviews.length === 1 && page > 1) setPage((p) => p - 1);
  };

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

          <div className="relative mx-auto max-w-4xl px-6 py-12 sm:py-14">
            <Link
              href="/me"
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              ← Back to your account
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-5">
              <div
                aria-hidden
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-sky-500 text-3xl shadow-md"
              >
                ⭐
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                  <span className="bg-linear-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
                    My reviews
                  </span>
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Every review you&apos;ve written or edited across all tours
                </p>
              </div>
            </div>

            {!isLoading && !isError && (
              <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-800 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {total} {total === 1 ? "review" : "reviews"}
                {isFiltered && " matching filter"}
              </span>
            )}
          </div>
        </section>

        {/* ============================ CONTENT ============================ */}
        <div className="mx-auto max-w-4xl px-6 py-12">
          {/* Filters */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by status"
                className={SELECT_CLASS}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                aria-label="Sort reviews"
                className={SELECT_CLASS}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <Link
              href="/tours"
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Browse tours to review →
            </Link>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-6" aria-busy="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="h-16 w-24 rounded-xl bg-gray-200" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-1/2 rounded bg-gray-200" />
                      <div className="h-4 w-1/3 rounded bg-gray-200" />
                    </div>
                  </div>
                  <div className="mt-5 space-y-2">
                    <div className="h-4 w-full rounded bg-gray-200" />
                    <div className="h-4 w-5/6 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800"
            >
              <span>
                We couldn&apos;t load your reviews:{" "}
                {(error as { message?: string })?.message || "Unknown error"}
              </span>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-700"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && reviews.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
              <span className="text-4xl" aria-hidden>
                💬
              </span>
              <h2 className="mt-3 text-lg font-semibold text-gray-900">
                {isFiltered ? "No reviews match this filter" : "No reviews yet"}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {isFiltered
                  ? "Try choosing a different status."
                  : "Share your experience on a tour you've taken and it will show up here."}
              </p>
              {isFiltered ? (
                <button
                  type="button"
                  onClick={() => {
                    setStatus("all");
                    setPage(1);
                  }}
                  className="mt-4 rounded-xl border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  Clear filter
                </button>
              ) : (
                <Link
                  href="/tours"
                  className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                >
                  Browse tours
                </Link>
              )}
            </div>
          )}

          {/* List */}
          {!isLoading && reviews.length > 0 && (
            <>
              <div
                className={`space-y-6 transition-opacity ${
                  isFetching ? "opacity-60" : "opacity-100"
                }`}
              >
                {reviews.map((r) => (
                  <MyReviewCard
                    key={r._id}
                    review={r}
                    onDeleted={handleDeleted}
                  />
                ))}
              </div>

              {pages > 1 && (
                <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className={PAGE_BTN}
                  >
                    Previous
                  </button>
                  <span className="text-sm font-semibold text-gray-700">
                    Page {page} of {pages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page >= pages}
                    className={PAGE_BTN}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
