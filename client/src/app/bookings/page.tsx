"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useMyBookings, useCancelBooking } from "@/hooks/useBookings";
import { formatCurrency, formatDate } from "@/lib/utils";
import { imageUrl } from "@/services/tours";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

export default function MyBookingsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<
    "all" | "pending" | "confirmed" | "cancelled" | "completed" | "refunded"
  >("all");

  const { data, isLoading, isError, error } = useMyBookings(page, status);
  const cancelMutation = useCancelBooking();

  const bookings = data?.data?.bookings ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 0;

  /**
   * Cancel is triggered only when the backend has already told us
   * `canCancel === true`. No `Date.now()` on the client — the entire
   * 24-hour rule lives in the backend, which is the source of truth.
   */
  const handleCancel = (bookingId: string) => {
    const reason = window.prompt(
      "Reason for cancellation (optional):",
      "Change of plans",
    );
    if (reason === null) return;
    cancelMutation.mutate({ id: bookingId, reason });
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-extrabold text-gray-900">My Bookings</h1>
      <p className="mt-2 text-sm text-gray-500">
        Manage your upcoming and past tours.
      </p>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {total} {total === 1 ? "booking" : "bookings"}
        </p>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as typeof status);
            setPage(1);
          }}
          className="cursor-pointer rounded-lg border-2 border-gray-400 bg-white px-3 py-2 text-sm font-semibold text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        >
          <option value="all">All</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {isLoading && (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-2xl border border-gray-200 p-4"
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

      {isError && (
        <p className="mt-6 text-sm text-red-600">
          Couldn&apos;t load bookings:{" "}
          {(error as { message?: string })?.message || "Unknown error"}
        </p>
      )}

      {!isLoading && !isError && bookings.length === 0 && (
        <div className="mt-10">
          <EmptyState
            icon="🎫"
            title="No bookings yet"
            description="Browse tours and book your next adventure."
          />
          <div className="mt-6 text-center">
            <Link
              href="/tours"
              className="inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Browse tours
            </Link>
          </div>
        </div>
      )}

      {bookings.length > 0 && (
        <div className="mt-6 space-y-4">
          {bookings.map((b) => {
            const tour = b.tour;
            const showCancelButton = b.canCancel === true;

            return (
              <div
                key={b._id}
                className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row"
              >
                <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-32">
                  <Image
                    src={imageUrl(tour.imageCover)}
                    alt={tour.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 128px"
                    className="object-cover"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/tours/${tour.slug}`}
                        className="text-lg font-bold text-gray-900 hover:text-emerald-700"
                      >
                        {tour.name}
                      </Link>
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
                            : b.status === "cancelled" ||
                                b.status === "refunded"
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

                  <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-xs">
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
                      💳 Payment: {b.paymentStatus}
                    </span>
                  </div>

                  {showCancelButton && (
                    <button
                      onClick={() => handleCancel(b._id)}
                      className="mt-3 rounded-lg border-2 border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-500 hover:bg-rose-50"
                    >
                      Cancel booking
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
}
