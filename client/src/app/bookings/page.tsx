"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useMyBookings, useCancelBooking } from "@/hooks/useBookings";
import { formatCurrency, formatDate } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import TourImage from "@/components/ui/TourImage";
import BookingDetailsModal from "@/components/bookings/BookingDetailsModal";
import type { Booking } from "@/services/bookings";

type StatusFilter = "all" | "pending" | "confirmed" | "cancelled" | "completed";

type PendingCancel = {
  id: string;
  tourName: string;
  startDate: string;
  price: number;
  paymentStatus: "unpaid" | "paid" | "refunded" | "failed";
};

export default function MyBookingsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [pendingCancel, setPendingCancel] = useState<PendingCancel | null>(
    null,
  );
  const [selected, setSelected] = useState<Booking | null>(null);

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

  const openCancelModal = (b: Booking | PendingCancel) => {
    setPendingCancel({
      id: "_id" in b ? b._id : b.id,
      tourName:
        "_id" in b
          ? (b.tour?.name ?? "this tour")
          : (b.tourName ?? "this tour"),
      startDate: b.startDate,
      price: b.price,
      paymentStatus: b.paymentStatus,
    });
  };

  const closeCancelModal = () => {
    if (cancelMutation.isPending) return;
    setPendingCancel(null);
  };

  const confirmCancel = (reason: string) => {
    if (!pendingCancel) return;
    cancelMutation.mutate(
      { id: pendingCancel.id, reason },
      {
        onSuccess: () => setPendingCancel(null),
      },
    );
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

                      {/* NEW: View details (opens modal) */}
                      <button
                        type="button"
                        onClick={() => setSelected(b)}
                        className="rounded-lg border-2 border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-800 transition hover:border-emerald-500 hover:bg-emerald-50"
                      >
                        View details
                      </button>

                      {showCancelButton && (
                        <button
                          onClick={() => openCancelModal(b)}
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

      {/* Booking details modal */}
      <BookingDetailsModal
        open={selected !== null}
        booking={selected}
        onClose={() => setSelected(null)}
        onRequestCancel={(b) => {
          setSelected(null);
          openCancelModal(b);
        }}
      />

      {/* Cancel confirmation modal (unchanged) */}
      <CancelBookingModal
        open={pendingCancel !== null}
        booking={pendingCancel}
        isSubmitting={cancelMutation.isPending}
        onClose={closeCancelModal}
        onConfirm={confirmCancel}
      />
    </div>
  );
}

/* ============================================================
   Cancel confirmation modal
   ============================================================ */
function CancelBookingModal({
  open,
  booking,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  booking: PendingCancel | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("Change of plans");
  const [reasonForId, setReasonForId] = useState<string | null>(null);

  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  if (booking && reasonForId !== booking.id) {
    setReasonForId(booking.id);
    setReason("Change of plans");
  }

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = window.setTimeout(() => cancelBtnRef.current?.focus(), 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const root = dialogRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, isSubmitting, onClose]);

  if (!open || !booking) return null;

  const willRefund = booking.paymentStatus === "paid";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        aria-hidden
        onClick={() => !isSubmitting && onClose()}
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
      >
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495a1.75 1.75 0 0 1 3.03 0l6.28 10.876A1.75 1.75 0 0 1 16.28 16H3.72a1.75 1.75 0 0 1-1.515-2.629L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h2 id={titleId} className="text-lg font-bold text-gray-900">
                Cancel this booking?
              </h2>
              <p id={descId} className="mt-1 text-sm text-gray-600">
                This will release your spot for{" "}
                <span className="font-semibold text-gray-900">
                  {booking.tourName}
                </span>{" "}
                on {formatDate(booking.startDate)}.
              </p>
            </div>
          </div>

          {willRefund && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              A refund of{" "}
              <span className="font-semibold">
                {formatCurrency(booking.price)}
              </span>{" "}
              will be issued to your original payment method shortly.
            </div>
          )}

          <div className="mt-4">
            <label
              htmlFor="cancel-reason"
              className="block text-sm font-semibold text-gray-700"
            >
              Reason{" "}
              <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <textarea
              id="cancel-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
              maxLength={500}
              className="mt-1 w-full resize-none rounded-lg border-2 border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Change of plans"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 p-4 sm:flex-row sm:justify-end">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Keep booking
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim())}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && (
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="opacity-25"
                />
                <path
                  d="M22 12a10 10 0 0 1-10 10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {isSubmitting ? "Cancelling…" : "Yes, cancel booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
