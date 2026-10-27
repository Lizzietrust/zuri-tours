"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import TourImage from "@/components/ui/TourImage";
import type { Booking } from "@/services/bookings";

type Props = {
  booking: Booking;
  /** Optional: shows a "Cancel booking" button if the server says it's allowed. */
  onRequestCancel?: (b: Booking) => void;
};

export default function BookingDetails({ booking, onRequestCancel }: Props) {
  const tour = booking.tour;

  const statusClasses: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
    cancelled: "bg-rose-100 text-rose-800",
    completed: "bg-gray-100 text-gray-700",
  };

  const paymentClasses: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700",
    refunded: "bg-rose-100 text-rose-700",
    failed: "bg-rose-100 text-rose-700",
    unpaid: "bg-amber-100 text-amber-800",
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-emerald-900/5">
      {/* -------- Hero image + title overlay -------- */}
      <div className="relative h-40 w-full bg-gray-100 sm:h-48">
        <TourImage
          src={tour?.imageCover}
          alt={tour?.name ?? "Tour"}
          sizes="(max-width: 640px) 100vw, 640px"
        />

        {/* Gradient scrim for legibility */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent"
        />

        {/* Title + ref (bottom-left) */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          {tour?.slug ? (
            <Link
              href={`/tours/${tour.slug}`}
              className="text-xl font-extrabold text-white drop-shadow-md transition hover:text-emerald-200 sm:text-2xl"
            >
              {tour.name}
            </Link>
          ) : (
            <h2 className="text-xl font-extrabold text-white drop-shadow-md sm:text-2xl">
              {tour?.name ?? "Tour"}
            </h2>
          )}
          <p className="mt-0.5 text-xs text-white/80">
            Ref: <span className="font-mono">{booking.bookingReference}</span>
          </p>
        </div>

        {/* Status badges (top-right) */}
        <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${
              statusClasses[booking.status] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {booking.status}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
              paymentClasses[booking.paymentStatus] ??
              "bg-gray-100 text-gray-700"
            }`}
          >
            💳 {booking.paymentStatus}
          </span>
        </div>
      </div>

      {/* -------- Body: detail grid -------- */}
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        <DetailRow label="Start date" value={formatDate(booking.startDate)} />
        <DetailRow
          label="Guests"
          value={`${booking.guests} guest${booking.guests > 1 ? "s" : ""}`}
        />
        <DetailRow
          label="Total price"
          value={formatCurrency(booking.price)}
          highlight
        />
        <DetailRow
          label="Payment method"
          value={labelPaymentMethod(booking.paymentMethod)}
        />

        {tour?.duration ? (
          <DetailRow label="Duration" value={`${tour.duration} days`} />
        ) : null}
        {tour?.difficulty ? (
          <DetailRow label="Difficulty" value={capitalize(tour.difficulty)} />
        ) : null}

        {booking.paidAt ? (
          <DetailRow label="Paid at" value={formatDate(booking.paidAt)} />
        ) : null}

        {booking.cancelledAt ? (
          <DetailRow
            label="Cancelled at"
            value={formatDate(booking.cancelledAt)}
          />
        ) : null}

        <DetailRow label="Booked on" value={formatDate(booking.createdAt)} />

        {booking.paystackReference ? (
          <DetailRow
            label="Paystack reference"
            value={
              <span className="font-mono text-xs break-all">
                {booking.paystackReference}
              </span>
            }
          />
        ) : null}
      </div>

      {/* Notes */}
      {booking.notes ? (
        <div className="border-t border-gray-100 p-5">
          <h3 className="text-xs font-bold tracking-wide text-gray-500 uppercase">
            Notes
          </h3>
          <p className="mt-1 text-sm whitespace-pre-wrap text-gray-700">
            {booking.notes}
          </p>
        </div>
      ) : null}

      {/* Cancel reason */}
      {booking.cancelReason ? (
        <div className="border-t border-gray-100 bg-rose-50/50 p-5">
          <h3 className="text-xs font-bold tracking-wide text-rose-700 uppercase">
            Cancellation reason
          </h3>
          <p className="mt-1 text-sm whitespace-pre-wrap text-rose-800">
            {booking.cancelReason}
          </p>
        </div>
      ) : null}

      {/* -------- Footer actions -------- */}
      <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 p-4 sm:flex-row sm:justify-end">
        {tour?.slug ? (
          <Link
            href={`/tours/${tour.slug}`}
            className="rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-center text-sm font-semibold text-gray-800 transition hover:border-gray-400 hover:bg-gray-100"
          >
            View tour
          </Link>
        ) : null}

        {booking.canCancel && onRequestCancel ? (
          <button
            type="button"
            onClick={() => onRequestCancel(booking)}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Cancel booking
          </button>
        ) : null}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
        {label}
      </p>
      <p
        className={`mt-0.5 text-sm ${
          highlight ? "font-bold text-emerald-700" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function labelPaymentMethod(m: string) {
  switch (m) {
    case "paystack":
      return "Paystack";
    case "card":
      return "Card";
    case "bank_transfer":
      return "Bank transfer";
    case "ussd":
      return "USSD";
    case "cash":
      return "Pay on arrival";
    default:
      return m;
  }
}
