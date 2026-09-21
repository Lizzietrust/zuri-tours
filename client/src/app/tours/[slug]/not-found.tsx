import Link from "next/link";

export default function TourNotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      <span className="text-5xl">🔍</span>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Tour not found</h1>
      <p className="mt-2 text-sm text-gray-600">
        The tour you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Link
        href="/tours"
        className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Browse all tours
      </Link>
    </div>
  );
}
