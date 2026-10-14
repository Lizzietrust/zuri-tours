"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTour } from "@/hooks/useTours";
import StarRating from "@/components/reviews/StarRating";
import RatingDistribution from "@/components/reviews/RatingDistribution";
import ReviewForm from "@/components/reviews/ReviewForm";
import ReviewList from "@/components/reviews/ReviewList";
import { imageUrl } from "@/services/tours";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatDistance } from "@/lib/geo";
import type { Tour } from "@/types";

const FALLBACK_IMG = "/placeholder-tour.jpg";

/* ---------- shared style maps (identical to TourCard) ---------- */

const DIFFICULTY_STYLES: Record<Tour["difficulty"], string> = {
  easy: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  medium: "bg-amber-100 text-amber-800 ring-amber-200",
  difficult: "bg-rose-100 text-rose-800 ring-rose-200",
};

const DIFFICULTY_LABEL: Record<Tour["difficulty"], string> = {
  easy: "Easy",
  medium: "Moderate",
  difficult: "Challenging",
};

/* ---------- icon helper (same as TourCard) ---------- */

const ICONS = {
  clock: "M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  users:
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  calendar:
    "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  check: "M20 6L9 17l-5-5",
  image: "M3 5h18v14H3zM8 11l3 3 3-4 4 5H3",
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

/* ---------- image gallery ---------- */

function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  const displayImages = useMemo(
    () => (images.length > 0 ? images : [FALLBACK_IMG]),
    [images],
  );

  const heroFailed = failed[active];

  return (
    <div className="space-y-3">
      <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-linear-to-br from-emerald-100 to-emerald-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroFailed ? FALLBACK_IMG : imageUrl(displayImages[active])}
          alt={`${name} — view ${active + 1}`}
          onError={() => setFailed((f) => ({ ...f, [active]: true }))}
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {displayImages.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === active
                  ? "border-emerald-600 ring-2 ring-emerald-200"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl(img)}
                alt=""
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                }}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- quick fact tile ---------- */

function FactTile({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <Icon path={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

/* ---------- booking sidebar ---------- */

function BookingCard({ tour }: { tour: Tour }) {
  const hasDiscount =
    typeof tour.priceDiscount === "number" &&
    tour.priceDiscount > 0 &&
    tour.priceDiscount < tour.price;

  const discountPercent = hasDiscount
    ? Math.round(((tour.price - tour.priceDiscount!) / tour.price) * 100)
    : 0;

  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState(tour.startDates?.[0]?.slice(0, 10) ?? "");

  const unitPrice = hasDiscount ? tour.priceDiscount! : tour.price;
  const totalPrice = unitPrice * guests;

  const handleBook = (e: FormEvent) => {
    e.preventDefault();
    alert(
      `Booking ${guests} ${guests === 1 ? "guest" : "guests"} for "${
        tour.name
      }"${date ? ` on ${date}` : ""} — ${formatCurrency(totalPrice)}`,
    );
  };

  return (
    <form
      onSubmit={handleBook}
      className="sticky top-24 space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-emerald-900/5"
    >
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
          <span className="text-xs tracking-wide text-gray-400 uppercase">
            per person
          </span>
        </div>
        {hasDiscount && (
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
            −{discountPercent}%
          </span>
        )}
      </div>

      <div>
        <label
          htmlFor="booking-date"
          className="mb-1 block text-xs font-semibold text-gray-600"
        >
          Select date
        </label>
        <input
          id="booking-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
        />
      </div>

      <div>
        <label
          htmlFor="booking-guests"
          className="mb-1 block text-xs font-semibold text-gray-600"
        >
          Guests
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setGuests((g) => Math.max(1, g - 1))}
            aria-label="Decrease guests"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-lg font-semibold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50"
          >
            −
          </button>
          <input
            id="booking-guests"
            type="number"
            min={1}
            max={tour.maxGroupSize}
            value={guests}
            onChange={(e) =>
              setGuests(
                Math.min(
                  tour.maxGroupSize,
                  Math.max(1, Number(e.target.value) || 1),
                ),
              )
            }
            className="w-16 rounded-lg border border-gray-200 py-2 text-center text-sm font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="button"
            onClick={() => setGuests((g) => Math.min(tour.maxGroupSize, g + 1))}
            aria-label="Increase guests"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-lg font-semibold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50"
          >
            +
          </button>
          <span className="text-xs text-gray-400">max {tour.maxGroupSize}</span>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
        <span className="text-sm font-semibold text-emerald-900">Total</span>
        <span className="text-xl font-extrabold text-emerald-700">
          {formatCurrency(totalPrice)}
        </span>
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      >
        Book now
      </button>

      <p className="text-center text-xs text-gray-400">
        Free cancellation up to 24h before
      </p>
    </form>
  );
}

/* ---------- states ---------- */

function TourDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="border-b border-gray-100 bg-linear-to-br from-emerald-50 via-white to-sky-50">
        <div className="mx-auto max-w-7xl animate-pulse px-6 py-10">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-20 rounded-full bg-gray-200" />
            <div className="h-6 w-24 rounded-full bg-gray-200" />
          </div>
          <div className="mt-4 h-10 w-3/4 rounded bg-gray-200" />
          <div className="mt-4 h-4 w-1/2 rounded bg-gray-200" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid animate-pulse gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <div className="aspect-16/10 w-full rounded-2xl bg-gray-200" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 w-24 rounded-lg bg-gray-200" />
              ))}
            </div>
            <div className="h-6 w-40 rounded bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-2/3 rounded bg-gray-200" />
            </div>
          </div>
          <div className="h-96 rounded-2xl bg-gray-200" />
        </div>
      </section>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <span className="text-5xl" aria-hidden>
        🧭
      </span>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Tour not found</h1>
      <p className="mt-2 text-sm text-gray-600">{message}</p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Try again
        </button>
        <Link
          href="/tours"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Browse all tours
        </Link>
      </div>
    </div>
  );
}

/* ---------- main ---------- */

export default function TourDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useTour(slug);

  /**
   * Shape-safety:
   * - If `useTour` returns the Tour directly → `data`
   * - If it returns `{ data: { tour } }` → `data.data.tour`
   * - If it returns `{ data: Tour }` → `data.data`
   * We try all three so this works with either hook shape.
   */
  const tour: Tour | undefined = useMemo(() => {
    if (!data) return undefined;
    const anyData = data as unknown as {
      data?: { tour?: Tour } | Tour;
      tour?: Tour;
    };
    if (
      anyData.data &&
      typeof anyData.data === "object" &&
      "tour" in anyData.data
    ) {
      return (anyData.data as { tour?: Tour }).tour;
    }
    if (anyData.data && typeof anyData.data === "object") {
      return anyData.data as Tour;
    }
    if (anyData.tour) return anyData.tour;
    return data as unknown as Tour;
  }, [data]);

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/tours");
    }
  }, [router]);

  if (isLoading) return <TourDetailSkeleton />;

  if (isError) {
    return (
      <ErrorState
        message={(error as Error)?.message ?? "Failed to load tour."}
        onRetry={() => refetch()}
      />
    );
  }

  if (!tour)
    return (
      <ErrorState
        message="This tour doesn't exist."
        onRetry={() => refetch()}
      />
    );

  const city = tour.location?.city;
  const country = tour.location?.country;
  const hasDistance =
    typeof tour.distance === "number" && Number.isFinite(tour.distance);

  const galleryImages = [tour.imageCover, ...(tour.images ?? [])].filter(
    Boolean,
  ) as string[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ============ HERO (same gradient + blur circles as ToursPage) ============ */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-linear-to-br from-emerald-50 via-white to-sky-50">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-6 py-10">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
          >
            <Icon path={ICONS.arrowLeft} className="h-4 w-4" />
            Back to tours
          </button>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                DIFFICULTY_STYLES[tour.difficulty] ?? DIFFICULTY_STYLES.medium
              }`}
            >
              {DIFFICULTY_LABEL[tour.difficulty] ?? tour.difficulty}
            </span>

            {tour.category && (
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold tracking-wide text-gray-700 uppercase ring-1 ring-gray-200">
                {tour.category}
              </span>
            )}

            {hasDistance && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 backdrop-blur">
                <span aria-hidden>📍</span>
                {formatDistance(tour.distance!)} away
              </span>
            )}

            {tour.featured && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                ★ Featured
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-gray-900 sm:text-5xl">
            {tour.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
            <StarRating
              value={tour.ratingsAverage}
              count={tour.ratingsQuantity}
              size="lg"
            />
            {(city || country) && (
              <span className="inline-flex items-center gap-1.5">
                <Icon path={ICONS.pin} className="h-4 w-4 text-emerald-600" />
                {[city, country].filter(Boolean).join(", ")}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Icon path={ICONS.clock} className="h-4 w-4 text-emerald-600" />
              {tour.duration} {tour.duration === 1 ? "day" : "days"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon path={ICONS.users} className="h-4 w-4 text-emerald-600" />
              Max {tour.maxGroupSize} guests
            </span>
          </div>

          {tour.summary && (
            <p className="mt-5 max-w-3xl text-lg text-pretty text-gray-700">
              {tour.summary}
            </p>
          )}
        </div>
      </section>

      {/* ============ MAIN ============ */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Left column */}
          <div className="space-y-10">
            <ImageGallery images={galleryImages} name={tour.name} />

            {tour.description && (
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  About this tour
                </h2>
                <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
                  {tour.description
                    .split("\n")
                    .map((p) => p.trim())
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold text-gray-900">Quick facts</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FactTile
                  icon={ICONS.clock}
                  label="Duration"
                  value={`${tour.duration} ${
                    tour.duration === 1 ? "day" : "days"
                  }`}
                />
                <FactTile
                  icon={ICONS.users}
                  label="Group size"
                  value={`Up to ${tour.maxGroupSize} guests`}
                />
                <FactTile
                  icon={ICONS.pin}
                  label="Location"
                  value={
                    [city, country].filter(Boolean).join(", ") ||
                    tour.location?.address ||
                    "Not specified"
                  }
                />
                {tour.startDates?.length > 0 && (
                  <FactTile
                    icon={ICONS.calendar}
                    label="Next departure"
                    value={formatDate(tour.startDates[0])}
                  />
                )}
              </div>
            </div>

            {tour.startDates?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Available dates
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tour.startDates.map((d, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800"
                    >
                      {formatDate(d)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews — wrapped in the same card language as ToursPage */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
              <h2 className="text-xl font-bold text-gray-900">Reviews</h2>

              <div className="mt-5 grid gap-6 lg:grid-cols-3">
                <aside className="lg:col-span-1">
                  <RatingDistribution tourId={tour._id} />
                </aside>
                <div className="lg:col-span-2">
                  <ReviewForm tourId={tour._id} />
                </div>
              </div>

              <hr className="my-6 border-gray-100" />

              <ReviewList tourId={tour._id} />
            </div>
          </div>

          {/* Right column */}
          <div>
            <BookingCard tour={tour} />
          </div>
        </div>
      </section>
    </div>
  );
}
