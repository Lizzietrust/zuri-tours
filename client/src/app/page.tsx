import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20 text-center">
      <h1 className="text-4xl font-bold text-gray-900">
        Explore the world with Zuri Tours
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
        Handcrafted tours, expert guides, and unforgettable memories.
      </p>

      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/tours"
          className="rounded bg-emerald-600 px-6 py-3 text-white hover:bg-emerald-700"
        >
          Browse Tours
        </Link>
        <Link
          href="/signup"
          className="rounded border border-emerald-600 px-6 py-3 text-emerald-700 hover:bg-emerald-50"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
