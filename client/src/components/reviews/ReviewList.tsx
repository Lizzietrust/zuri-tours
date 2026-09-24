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
    <div>
      {/* Sort bar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {total} {total === 1 ? "review" : "reviews"}
        </p>

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="-createdAt">Newest</option>
          <option value="createdAt">Oldest</option>
          <option value="-rating">Highest rated</option>
          <option value="rating">Lowest rated</option>
          <option value="-helpfulCount">Most helpful</option>
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2 border-b border-gray-100 py-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <p className="text-sm text-red-600">
          Couldn&apos;t load reviews:{" "}
          {(error as { message?: string })?.message || "Unknown error"}
        </p>
      )}

      {/* Empty */}
      {!isLoading && !isError && reviews.length === 0 && (
        <EmptyState
          icon="💬"
          title="No reviews yet"
          description="Be the first to share your experience with this tour."
        />
      )}

      {/* List */}
      {!isLoading && reviews.length > 0 && (
        <>
          <div className={isFetching ? "opacity-60" : ""}>
            {reviews.map((r) => (
              <ReviewCard key={r._id} review={r} />
            ))}
          </div>

          {pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-gray-500">
                Page {page} of {pages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
