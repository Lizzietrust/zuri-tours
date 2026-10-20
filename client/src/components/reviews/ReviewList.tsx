"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { reviewService } from "@/services/reviews";
import ReviewCard from "./ReviewCard";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import type { Review } from "@/types";

export default function ReviewList({ tourId }: { tourId: string }) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("-createdAt");
  const limit = 5;

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["reviews", tourId, { page, sort }],
    queryFn: () => reviewService.getForTour(tourId, { page, limit, sort }),
    enabled: !!tourId,
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60,
  });

  const reviews = (data?.data?.reviews || []) as Review[];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xl font-bold text-gray-900">
          {total} {total === 1 ? "Review" : "Reviews"}
        </h3>

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          aria-label="Sort reviews"
          className="cursor-pointer rounded-lg border-2 border-gray-400 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:border-emerald-500 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        >
          <option value="-createdAt" className="font-medium text-gray-900">
            Most Recent
          </option>
          <option value="createdAt" className="font-medium text-gray-900">
            Oldest
          </option>
          <option value="-rating" className="font-medium text-gray-900">
            Highest Rated
          </option>
          <option value="rating" className="font-medium text-gray-900">
            Lowest Rated
          </option>
          <option value="-helpfulCount" className="font-medium text-gray-900">
            Most Helpful
          </option>
        </select>
      </div>

      {isLoading && (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 border-b border-gray-100 pb-6"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          Couldn&apos;t load reviews:{" "}
          {(error as { message?: string })?.message || "Unknown error"}
        </div>
      )}

      {!isLoading && !isError && reviews.length === 0 && (
        <EmptyState
          icon="💬"
          title="No reviews yet"
          description="Be the first to share your experience with this tour."
        />
      )}

      {!isLoading && reviews.length > 0 && (
        <>
          <div
            className={`space-y-6 transition-opacity ${
              isFetching ? "opacity-50" : "opacity-100"
            }`}
          >
            {reviews.map((r) => (
              <ReviewCard key={r._id} review={r} />
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 pt-6">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border-2 border-gray-400 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-emerald-500 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
              >
                Previous
              </button>

              <span className="text-sm font-semibold text-gray-700">
                Page {page} of {pages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="rounded-lg border-2 border-gray-400 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-emerald-500 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
