import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import StarRating from "@/components/reviews/StarRating";
import RatingDistribution from "@/components/reviews/RatingDistribution";
import ReviewForm from "@/components/reviews/ReviewForm";
import ReviewList from "@/components/reviews/ReviewList";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Tour } from "@/types";

/* ---------- Server-side fetch ---------- */

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

async function fetchTour(slug: string): Promise<Tour | null> {
  try {
    const res = await fetch(`${API_URL}/tours/${slug}?populateReviews=false`, {
      // ISR: re-generate at most every 5 minutes
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;

    const json = await res.json();
    return json.data.tour as Tour;
  } catch {
    return null;
  }
}

/* ---------- SEO ---------- */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tour = await fetchTour(slug);

  if (!tour) return { title: "Tour not found | Zuri Tours" };

  return {
    title: `${tour.name} | Zuri Tours`,
    description: tour.summary,
    openGraph: {
      title: tour.name,
      description: tour.summary,
      images: [`http://localhost:8000/img/tours/${tour.imageCover}`],
    },
  };
}

/* ---------- Page ---------- */

export default async function TourPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tour = await fetchTour(slug);

  if (!tour) notFound();

  const hasDiscount =
    typeof tour.priceDiscount === "number" &&
    tour.priceDiscount > 0 &&
    tour.priceDiscount < tour.price;

  const difficultyVariant =
    tour.difficulty === "easy"
      ? "success"
      : tour.difficulty === "medium"
        ? "warning"
        : "danger";

  return (
    <article className="mx-auto max-w-6xl px-6 py-12">
      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-emerald-700">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/tours" className="hover:text-emerald-700">
          Tours
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{tour.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* ---------- Main column ---------- */}
        <div className="lg:col-span-2">
          {/* Hero image */}
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`http://localhost:8000/img/tours/${tour.imageCover}`}
              alt={tour.name}
              className="h-full w-full object-cover"
            />
            {hasDiscount && (
              <div className="absolute right-4 top-4 rounded-full bg-rose-500 px-3 py-1 text-sm font-bold text-white shadow">
                -
                {Math.round(
                  ((tour.price - tour.priceDiscount!) / tour.price) * 100,
                )}
                %
              </div>
            )}
          </div>

          {/* Title row */}
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={difficultyVariant}>
                {tour.difficulty.charAt(0).toUpperCase() +
                  tour.difficulty.slice(1)}
              </Badge>
              <Badge variant="neutral">{tour.category}</Badge>
              {tour.featured && <Badge variant="info">Featured</Badge>}
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
              {tour.name}
            </h1>

            <p className="mt-2 text-gray-600">{tour.summary}</p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <StarRating
                  value={tour.ratingsAverage}
                  count={tour.ratingsQuantity}
                />
              </div>
              <span className="text-gray-300">·</span>
              <span>
                ⏱ {tour.duration} {tour.duration === 1 ? "day" : "days"}
              </span>
              <span className="text-gray-300">·</span>
              <span>👥 Max {tour.maxGroupSize}</span>
            </div>
          </div>

          {/* Quick facts */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Duration
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {tour.duration} {tour.duration === 1 ? "day" : "days"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Group size
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                Max {tour.maxGroupSize}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Difficulty
              </p>
              <p className="mt-1 text-sm font-semibold capitalize text-gray-800">
                {tour.difficulty}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Category
              </p>
              <p className="mt-1 text-sm font-semibold capitalize text-gray-800">
                {tour.category}
              </p>
            </div>
          </div>

          {/* Description */}
          <Card className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">
              About this tour
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {tour.description}
            </p>
          </Card>

          {/* Start dates */}
          {tour.startDates && tour.startDates.length > 0 && (
            <Card className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Upcoming departures
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {tour.startDates.map((d) => (
                  <li
                    key={d}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 text-sm"
                  >
                    <span className="text-gray-800">{formatDate(d)}</span>
                    <span className="text-xs text-gray-400">Available</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Location */}
          {tour.location?.address && (
            <Card className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900">Location</h2>
              <p className="mt-3 text-sm text-gray-700">
                📍 {tour.location.address}
              </p>
              {tour.location.city && (
                <p className="mt-1 text-xs text-gray-500">
                  {tour.location.city}
                  {tour.location.country ? `, ${tour.location.country}` : ""}
                </p>
              )}
            </Card>
          )}

          {/* Reviews section */}
          <Card className="mt-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Reviews</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <aside className="lg:col-span-1">
                <RatingDistribution tourId={tour._id} />
              </aside>

              <div className="lg:col-span-2">
                <ReviewForm tourId={tour._id} />
              </div>
            </div>

            <hr className="my-6 border-gray-100" />

            <ReviewList tourId={tour._id} />
          </Card>
        </div>

        {/* ---------- Sidebar ---------- */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            {/* Booking card */}
            <Card>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                From
              </p>
              <div className="mt-1 flex items-end gap-2">
                {hasDiscount ? (
                  <>
                    <span className="text-3xl font-bold text-emerald-700">
                      {formatCurrency(tour.priceDiscount!)}
                    </span>
                    <span className="pb-1 text-sm text-gray-400 line-through">
                      {formatCurrency(tour.price)}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-emerald-700">
                    {formatCurrency(tour.price)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">per person</p>

              <button
                type="button"
                disabled
                className="mt-4 w-full cursor-not-allowed rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white opacity-70"
              >
                Book this tour (coming soon)
              </button>
              <p className="mt-2 text-center text-xs text-gray-400">
                Bookings open soon
              </p>
            </Card>

            {/* Quick stats */}
            <Card>
              <h3 className="text-sm font-semibold text-gray-900">
                At a glance
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Rating</dt>
                  <dd className="font-medium text-gray-800">
                    {tour.ratingsAverage} / 5
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Reviews</dt>
                  <dd className="font-medium text-gray-800">
                    {tour.ratingsQuantity}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Duration</dt>
                  <dd className="font-medium text-gray-800">
                    {tour.duration} {tour.duration === 1 ? "day" : "days"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Max group</dt>
                  <dd className="font-medium text-gray-800">
                    {tour.maxGroupSize}
                  </dd>
                </div>
              </dl>
            </Card>
          </div>
        </aside>
      </div>
    </article>
  );
}
