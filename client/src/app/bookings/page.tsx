"use client";

import Link from "next/link";
import { useState } from "react";
import { useMyBookings, useCancelBooking } from "@/hooks/useBookings";
import { formatCurrency, formatDate } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import TourImage from "@/components/ui/TourImage";

type StatusFilter = "all" | "pending" | "confirmed" | "cancelled" | "completed";

export default function MyBookingsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("all");

  const { data, isLoading, isError, error, refetch } = useMyBookings(
    page,
    status,
  );
  const cancelMutation = useCancelBooking();

  const bookings = data?.data?.bookings ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 0;

  const errorMessage =
    (error as { message?: string })?.message || "Unknown error";
  const isRateLimited =
    /too many requests|429/i.test(errorMessage) ||
    (error as { statusCode?: number })?.statusCode === 429;

  const handleCancel = (bookingId: string) => {
    const reason = window.prompt(
      "Reason for cancellation (optional):",
      "Change of plans",
    );
    if (reason === null) return;
    cancelMutation.mutate({ id: bookingId, reason });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero header */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-linear-to-br from-emerald-50 via-white to-sky-50">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl px-6 py-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            My Bookings
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your upcoming and past tours.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        {/* Filter bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-gray-600">
            {total} {total === 1 ? "booking" : "bookings"}
          </p>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter);
              setPage(1);
            }}
            className="cursor-pointer rounded-lg border-2 border-gray-400 bg-white px-3 py-2 text-sm font-semibold text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="all">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4"
              >
                <Skeleton className="h-24 w-32 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-rose-900">
                {isRateLimited
                  ? "Too many requests — please wait a moment"
                  : "Couldn't load your bookings"}
              </p>
              <p className="mt-1 text-sm text-rose-700">
                {isRateLimited
                  ? "The server is throttling requests. Try again in a few minutes."
                  : errorMessage}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && bookings.length === 0 && (
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-lg shadow-emerald-900/5">
            <EmptyState
              icon="🎫"
              title="No bookings yet"
              description="Browse tours and book your next adventure."
            />
            <div className="mt-6">
              <Link
                href="/tours"
                className="inline-block rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
              >
                Browse tours
              </Link>
            </div>
          </div>
        )}

        {/* List */}
        {bookings.length > 0 && (
          <div className="mt-6 space-y-4">
            {bookings.map((b) => {
              const tour = b.tour;
              const showCancelButton = b.canCancel === true;

              return (
                <div
                  key={b._id}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg shadow-emerald-900/5 transition hover:border-emerald-200 sm:flex-row"
                >
                  <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-32">
                    <TourImage
                      src={tour?.imageCover}
                      alt={tour?.name ?? "Tour"}
                      sizes="(max-width: 640px) 100vw, 128px"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {tour?.slug ? (
                          <Link
                            href={`/tours/${tour.slug}`}
                            className="text-lg font-bold text-gray-900 transition hover:text-emerald-700"
                          >
                            {tour.name}
                          </Link>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            {tour?.name ?? "Tour"}
                          </span>
                        )}
                        <p className="text-xs text-gray-500">
                          Ref: {b.bookingReference}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          b.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : b.status === "cancelled"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                      <span>📅 {formatDate(b.startDate)}</span>
                      <span>
                        👥 {b.guests} guest{b.guests > 1 ? "s" : ""}
                      </span>
                      <span className="font-semibold text-emerald-700">
                        {formatCurrency(b.price)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                          b.paymentStatus === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : b.paymentStatus === "refunded"
                              ? "bg-rose-100 text-rose-700"
                              : b.paymentStatus === "failed"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        💳 {b.paymentStatus}
                      </span>

                      {showCancelButton && (
                        <button
                          onClick={() => handleCancel(b._id)}
                          className="rounded-lg border-2 border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-500 hover:bg-rose-50"
                        >
                          Cancel booking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border-2 border-gray-400 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-emerald-500 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-gray-700">
              Page {page} of {pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="rounded-lg border-2 border-gray-400 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-emerald-500 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
