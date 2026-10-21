"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCreateBooking } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Tour } from "@/types";

type Props = { tour: Tour };

/**
 * Module-scope timestamp — runs once when the file is imported.
 * No component is rendering, so React 19's purity rule doesn't apply.
 * Freezes at page load — plenty precise for a booking date picker.
 * (Backend re-validates the selected date on submit anyway.)
 */
const TODAY_MS = Date.now();

export default function BookingCard({ tour }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const createBooking = useCreateBooking();

  const hasDiscount =
    typeof tour.priceDiscount === "number" &&
    tour.priceDiscount > 0 &&
    tour.priceDiscount < tour.price;

  const discountPercent = hasDiscount
    ? Math.round(((tour.price - tour.priceDiscount!) / tour.price) * 100)
    : 0;

  const availableDates = useMemo(
    () =>
      (tour.startDates || [])
        .map((d) => new Date(d))
        .filter((d) => d.getTime() > TODAY_MS)
        .sort((a, b) => a.getTime() - b.getTime()),
    [tour.startDates],
  );

  const [date, setDate] = useState(
    availableDates[0]?.toISOString().slice(0, 10) ?? "",
  );
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const unitPrice = hasDiscount ? tour.priceDiscount! : tour.price;
  const totalPrice = unitPrice * guests;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    if (!isAuthenticated) {
      router.push(`/login?redirect=/tours/${tour.slug}`);
      return;
    }

    if (!date) {
      setFieldError("Please select a date.");
      return;
    }
    if (guests < 1 || guests > tour.maxGroupSize) {
      setFieldError(`Guests must be between 1 and ${tour.maxGroupSize}.`);
      return;
    }

    createBooking.mutate(
      {
        tourId: tour._id,
        guests,
        startDate: date,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: ({ payment, booking }) => {
          /* 1) Clear the form */
          setGuests(1);
          setNotes("");
          setDate(availableDates[0]?.toISOString().slice(0, 10) ?? "");
          setFieldError(null);

          /* 2) Save pending booking reference to sessionStorage */
          try {
            sessionStorage.setItem(
              "pendingBooking",
              JSON.stringify({
                bookingId: booking._id,
                reference: payment.reference,
                tourSlug: tour.slug,
              }),
            );
          } catch {
            /* ignore storage errors */
          }

          /* 3) Redirect to Paystack */
          window.location.href = payment.authorizationUrl;
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky top-24 space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-emerald-900/5"
    >
      {/* Price header */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          {hasDiscount && (
            <span className="text-sm font-medium text-gray-400 line-through">
              {formatCurrency(tour.price)}
            </span>
          )}
          <span className="text-3xl font-extrabold text-emerald-700">
            {formatCurrency(unitPrice)}
          </span>
          <span className="text-xs tracking-wide text-gray-500 uppercase">
            per person
          </span>
        </div>
        {hasDiscount && (
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
            −{discountPercent}%
          </span>
        )}
      </div>

      {/* Date */}
      <div>
        <label
          htmlFor="booking-date"
          className="mb-1.5 block text-xs font-semibold tracking-wide text-gray-700 uppercase"
        >
          Select date
        </label>
        {availableDates.length > 0 ? (
          <select
            id="booking-date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (fieldError) setFieldError(null);
            }}
            required
            className="w-full cursor-pointer rounded-xl border-2 border-gray-400 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 transition hover:border-emerald-500 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {availableDates.map((d) => (
              <option
                key={d.toISOString()}
                value={d.toISOString().slice(0, 10)}
                className="font-medium text-gray-900"
              >
                {formatDate(d.toISOString())}
              </option>
            ))}
          </select>
        ) : (
          <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            No upcoming dates for this tour.
          </div>
        )}
      </div>

      {/* Guests */}
      <div>
        <label
          htmlFor="booking-guests"
          className="mb-1.5 block text-xs font-semibold tracking-wide text-gray-700 uppercase"
        >
          Guests
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setGuests((g) => Math.max(1, g - 1));
              if (fieldError) setFieldError(null);
            }}
            aria-label="Decrease guests"
            className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-400 text-lg font-semibold text-gray-700 transition hover:border-emerald-500 hover:bg-emerald-50"
          >
            −
          </button>
          <input
            id="booking-guests"
            type="number"
            min={1}
            max={tour.maxGroupSize}
            value={guests}
            onChange={(e) => {
              setGuests(
                Math.min(
                  tour.maxGroupSize,
                  Math.max(1, Number(e.target.value) || 1),
                ),
              );
              if (fieldError) setFieldError(null);
            }}
            className="w-16 rounded-lg border-2 border-gray-400 py-2 text-center text-sm font-semibold text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
          <button
            type="button"
            onClick={() => {
              setGuests((g) => Math.min(tour.maxGroupSize, g + 1));
              if (fieldError) setFieldError(null);
            }}
            aria-label="Increase guests"
            className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-400 text-lg font-semibold text-gray-700 transition hover:border-emerald-500 hover:bg-emerald-50"
          >
            +
          </button>
          <span className="text-xs text-gray-500">max {tour.maxGroupSize}</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="booking-notes"
          className="mb-1.5 block text-xs font-semibold tracking-wide text-gray-700 uppercase"
        >
          Notes (optional)
        </label>
        <textarea
          id="booking-notes"
          rows={2}
          maxLength={300}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Dietary needs, accessibility, special requests…"
          className="w-full rounded-xl border-2 border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      {/* Total */}
      <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
        <span className="text-sm font-semibold text-emerald-900">
          Total ({guests} {guests === 1 ? "guest" : "guests"})
        </span>
        <span className="text-xl font-extrabold text-emerald-700">
          {formatCurrency(totalPrice)}
        </span>
      </div>

      {fieldError && (
        <p className="text-sm font-medium text-rose-600">{fieldError}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={createBooking.isPending || availableDates.length === 0}
        className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {createBooking.isPending
          ? "Redirecting to payment…"
          : isAuthenticated
            ? "Continue to payment"
            : "Log in to book"}
      </button>

      <p className="text-center text-xs text-gray-500">
        Secure payment via Paystack · Free cancellation up to 24h before
      </p>
    </form>
  );
}
