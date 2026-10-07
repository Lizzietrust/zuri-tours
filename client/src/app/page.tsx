"use client";

import Link from "next/link";
import { useFeaturedTours } from "@/hooks/useTours";
import TourCard from "@/components/tours/TourCard";
import TourCardSkeleton from "@/components/tours/TourCardSkeleton";

export default function HomePage() {
  const { data: featured, isLoading, isError } = useFeaturedTours(3);

  return (
    <div className="min-h-screen">
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden bg-linear-to-br from-emerald-50 via-white to-sky-50">
        {/* Decorative blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center sm:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-800 backdrop-blur">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            New tours added weekly
          </span>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            Explore the world with{" "}
            <span className="bg-linear-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
              Zuri Tours
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Handcrafted tours, expert guides, and unforgettable memories —
            curated for the way you love to travel.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/tours"
              className="rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-emerald-700/30"
            >
              Browse Tours
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-emerald-600 bg-white px-6 py-3 text-base font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Get Started
            </Link>
          </div>

          {/* Trust bar */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
            <span>⭐ 4.8 average rating</span>
            <span className="hidden sm:inline">·</span>
            <span>🌍 40+ destinations</span>
            <span className="hidden sm:inline">·</span>
            <span>👥 Expert local guides</span>
          </div>
        </div>
      </section>

      {/* ======================= FEATURED TOURS ======================= */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Featured tours
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              The highest-rated adventures our travelers love
            </p>
          </div>
          <Link
            href="/tours"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            View all tours →
          </Link>
        </div>

        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <TourCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            We couldn&apos;t load featured tours right now.{" "}
            <Link
              href="/tours"
              className="font-semibold underline hover:no-underline"
            >
              Browse all tours
            </Link>
            .
          </div>
        )}

        {!isLoading && !isError && featured && featured.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((tour) => (
              <TourCard key={tour._id} tour={tour} />
            ))}
          </div>
        )}

        {!isLoading && !isError && (!featured || featured.length === 0) && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
            <span className="text-4xl">🧭</span>
            <p className="mt-3 text-sm text-gray-600">
              No tours published yet. Check back soon!
            </p>
            <Link
              href="/tours"
              className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Browse tours
            </Link>
          </div>
        )}
      </section>

      {/* ========================= WHY ZURI ========================== */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Why travel with Zuri?
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600">
              We obsess over the details so you can focus on the journey.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: "🎯",
                title: "Curated experiences",
                body: "Every tour is hand-picked and vetted by our team of travel experts.",
              },
              {
                icon: "🧑‍🏫",
                title: "Expert local guides",
                body: "Learn from guides who call each destination home.",
              },
              {
                icon: "🛡️",
                title: "Book with confidence",
                body: "Flexible cancellation and 24/7 support on every trip.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xl">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {f.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ CTA ============================ */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-emerald-600 to-sky-600 px-8 py-12 text-center shadow-xl sm:px-16 sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, white 0%, transparent 40%), radial-gradient(circle at 80% 80%, white 0%, transparent 40%)",
            }}
          />
          <div className="relative">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready for your next adventure?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-emerald-50">
              Sign up free and start planning your trip today.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-white px-6 py-3 text-base font-semibold text-emerald-700 shadow-lg transition hover:bg-emerald-50"
              >
                Create free account
              </Link>
              <Link
                href="/tours"
                className="rounded-xl border border-white/70 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Browse tours
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
