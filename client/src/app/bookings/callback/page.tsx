"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useVerifyPayment } from "@/hooks/useBookings";
import { formatCurrency, formatDate } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { toast } from "sonner";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  const {
    data: booking,
    isLoading,
    isError,
    error,
  } = useVerifyPayment(reference ?? null);

  /**
   * Use a ref, NOT state, for the "have we shown the toast yet?" flag.
   *
   * Why:
   *  - React 19 forbids setState inside useEffect.
   *  - Refs don't trigger re-renders, so no cascade.
   *  - A ref is stable for the life of the component instance,
   *    which is exactly what we need — show the toast exactly once.
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
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-sm text-gray-600">
          Missing payment reference. If you just paid, check your email or go to{" "}
          <Link href="/bookings" className="text-emerald-700 underline">
            My Bookings
          </Link>
          .
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-6 py-24 text-center">
        <div className="text-5xl">💳</div>
        <h1 className="text-2xl font-bold text-gray-900">
          Verifying your payment…
        </h1>
        <p className="text-sm text-gray-500">
          Please don&apos;t close this page.
        </p>
        <Skeleton className="mx-auto h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <div className="text-5xl">😞</div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          We couldn&apos;t verify your payment
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {(error as { message?: string })?.message ||
            "Please contact support with your payment reference."}
        </p>
        <p className="mt-2 text-xs text-gray-400">Ref: {reference}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => router.push("/bookings")}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Go to My Bookings
          </button>
          <Link
            href="/tours"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Browse tours
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          ✅
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-gray-900">
          Payment successful
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Your booking is confirmed. A receipt has been recorded.
        </p>
      </div>

      <div className="mt-8 space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Booking ref</span>
          <span className="font-semibold text-gray-900">
            {booking.bookingReference}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tour</span>
          <span className="font-semibold text-gray-900">
            {booking.tour.name}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Date</span>
          <span className="font-semibold text-gray-900">
            {formatDate(booking.startDate)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Guests</span>
          <span className="font-semibold text-gray-900">{booking.guests}</span>
        </div>
        <div className="flex justify-between border-t border-gray-100 pt-3 text-base">
          <span className="font-semibold text-gray-700">Total paid</span>
          <span className="font-extrabold text-emerald-700">
            {formatCurrency(booking.price)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Payment status</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold uppercase tracking-wide text-emerald-800">
            {booking.paymentStatus}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/bookings"
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          View my bookings
        </Link>
        <Link
          href={`/tours/${booking.tour.slug}`}
          className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Back to tour
        </Link>
      </div>
    </div>
  );
}

export default function BookingCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-6 py-24 text-center text-sm text-gray-500">
          Verifying…
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
