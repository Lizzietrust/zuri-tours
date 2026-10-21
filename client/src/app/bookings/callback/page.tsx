"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useVerifyPayment } from "@/hooks/useBookings";
import { formatCurrency, formatDate } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { toast } from "sonner";

/* ---------- Icon helper (same as TourDetailClient) ---------- */

const ICONS = {
  checkCircle: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3",
  warning:
    "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  loader: "M21 12a9 9 0 1 1-9-9M21 3v6h-6",
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  receipt:
    "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1zM16 8H8M16 12H8M13 16H8",
  calendar:
    "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  users:
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
} as const;

function Icon({
  path,
  className = "h-4 w-4",
}: {
  path: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

/* ---------- Shared backdrop ---------- */

function Backdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl"
      />
    </>
  );
}

/* ---------- Verification loader ---------- */

function VerifyingState() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-emerald-50 via-white to-sky-50">
      <Backdrop />

      <div className="relative mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Icon path={ICONS.loader} className="h-10 w-10 animate-spin" />
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-gray-900">
          Verifying your payment…
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Please don&apos;t close this page. This should only take a moment.
        </p>
        <div className="mt-8 w-full space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

/* ---------- Missing reference ---------- */

function MissingReferenceState() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-emerald-50 via-white to-sky-50">
      <Backdrop />

      <div className="relative mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Icon path={ICONS.warning} className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-gray-900">
          Missing payment reference
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          We couldn&apos;t find a payment reference on this URL. If you just
          paid, your booking may already be confirmed — check My Bookings below.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/bookings"
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            Go to My Bookings
          </Link>
          <Link
            href="/tours"
            className="rounded-xl border-2 border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-emerald-500 hover:bg-emerald-50"
          >
            Browse tours
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ---------- Failure state ---------- */

function FailureState({
  reference,
  message,
}: {
  reference: string;
  message: string;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-rose-50 via-white to-amber-50">
      <Backdrop />

      <div className="relative mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-700">
          <Icon path={ICONS.warning} className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-gray-900">
          We couldn&apos;t verify your payment
        </h1>
        <p className="mt-2 text-sm text-gray-600">{message}</p>

        <div className="mt-6 w-full rounded-2xl border border-rose-200 bg-white/80 p-4 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Payment reference
          </p>
          <p className="mt-1 break-all text-sm font-mono text-gray-900">
            {reference}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/bookings"
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            Go to My Bookings
          </Link>
          <Link
            href="/tours"
            className="rounded-xl border-2 border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-emerald-500 hover:bg-emerald-50"
          >
            Browse tours
          </Link>
        </div>

        <p className="mt-8 text-xs text-gray-400">
          Still stuck? Contact support with the reference above.
        </p>
      </div>
    </div>
  );
}

/* ---------- Success state ---------- */

function SuccessState({
  booking,
}: {
  booking: {
    bookingReference: string;
    tour: { name: string; slug: string };
    startDate: string;
    guests: number;
    price: number;
    paymentStatus: string;
  };
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-emerald-50 via-white to-sky-50">
      <Backdrop />

      <div className="relative mx-auto max-w-lg px-6 py-16">
        {/* Success hero */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-lg shadow-emerald-600/20">
            <Icon path={ICONS.checkCircle} className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900">
            Payment successful
          </h1>
          <p className="mt-2 max-w-md text-sm text-gray-600">
            Your booking is confirmed and a receipt has been recorded.
            You&apos;ll receive an email shortly.
          </p>
        </div>

        {/* Receipt card */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-emerald-900/5">
          {/* Card header */}
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/50 px-6 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Icon path={ICONS.receipt} className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                Booking receipt
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {booking.bookingReference}
              </p>
            </div>
          </div>

          {/* Tour summary */}
          <div className="px-6 py-5">
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Tour
            </p>
            <Link
              href={`/tours/${booking.tour.slug}`}
              className="mt-1 block text-lg font-bold text-gray-900 transition hover:text-emerald-700"
            >
              {booking.tour.name}
            </Link>

            <dl className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <dt className="inline-flex items-center gap-2 text-gray-500">
                  <Icon
                    path={ICONS.calendar}
                    className="h-4 w-4 text-emerald-600"
                  />
                  Date
                </dt>
                <dd className="font-semibold text-gray-900">
                  {formatDate(booking.startDate)}
                </dd>
              </div>

              <div className="flex items-center justify-between text-sm">
                <dt className="inline-flex items-center gap-2 text-gray-500">
                  <Icon
                    path={ICONS.users}
                    className="h-4 w-4 text-emerald-600"
                  />
                  Guests
                </dt>
                <dd className="font-semibold text-gray-900">
                  {booking.guests}
                </dd>
              </div>

              <div className="flex items-center justify-between text-sm">
                <dt className="inline-flex items-center gap-2 text-gray-500">
                  <Icon path={ICONS.tag} className="h-4 w-4 text-emerald-600" />
                  Payment
                </dt>
                <dd>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold tracking-wide text-emerald-800 uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    {booking.paymentStatus}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between border-t border-gray-100 bg-emerald-50/60 px-6 py-4">
            <span className="text-sm font-semibold text-emerald-900">
              Total paid
            </span>
            <span className="text-2xl font-extrabold text-emerald-700">
              {formatCurrency(booking.price)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/bookings"
            className="flex-1 rounded-xl bg-emerald-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            View my bookings
          </Link>
          <Link
            href={`/tours/${booking.tour.slug}`}
            className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-5 py-3 text-center text-sm font-semibold text-gray-700 transition hover:border-emerald-500 hover:bg-emerald-50"
          >
            Back to tour
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          A copy of this receipt has been sent to your email.
        </p>
      </div>
    </div>
  );
}

/* ---------- Main component ---------- */

function CallbackContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  const {
    data: booking,
    isLoading,
    isError,
    error,
  } = useVerifyPayment(reference ?? null);

  /**
   * Show the toast exactly once per mount, without breaking React 19's
   * purity rules. Refs don't trigger re-renders, so this is safe inside
   * an effect.
   */
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (toastShownRef.current) return;

    if (booking) {
      toastShownRef.current = true;
      toast.success("Payment successful!", {
        description: `Booking ${booking.bookingReference} confirmed.`,
      });
      try {
        sessionStorage.removeItem("pendingBooking");
      } catch {
        /* ignore */
      }
      return;
    }

    if (isError) {
      toastShownRef.current = true;
      toast.error("Payment verification failed", {
        description:
          (error as { message?: string })?.message ||
          "Please contact support with your reference.",
      });
    }
  }, [booking, isError, error]);

  if (!reference) {
    return <MissingReferenceState />;
  }

  if (isLoading) {
    return <VerifyingState />;
  }

  if (isError || !booking) {
    return (
      <FailureState
        reference={reference}
        message={
          (error as { message?: string })?.message ||
          "Please contact support with your payment reference."
        }
      />
    );
  }

  return <SuccessState booking={booking} />;
}

/* ---------- Page export ---------- */

export default function BookingCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-emerald-50 via-white to-sky-50">
          <Backdrop />
          <div className="relative mx-auto max-w-lg px-6 py-24 text-center">
            <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Icon path={ICONS.loader} className="h-10 w-10 animate-spin" />
            </div>
            <p className="mt-6 text-sm font-medium text-gray-600">Verifying…</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
