"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      <span className="text-5xl">💥</span>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        {error.message || "An unexpected error occurred."}
      </p>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Try again
        </button>

        <Link
          href="/"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
