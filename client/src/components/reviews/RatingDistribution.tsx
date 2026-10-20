"use client";

import { useQuery } from "@tanstack/react-query";
import { reviewService } from "@/services/reviews";
import StarRating from "./StarRating";
import Skeleton from "@/components/ui/Skeleton";

export default function RatingDistribution({ tourId }: { tourId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["review-stats", tourId],
    queryFn: () => reviewService.getStats(tourId),
    enabled: !!tourId,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 rounded-xl border border-gray-200 p-6">
        <div className="flex gap-4">
          <Skeleton className="h-16 w-16" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500">
          Couldn&apos;t load rating summary.
        </p>
      </div>
    );
  }

  const stats = data.stats as {
    totalReviews?: number;
    averageRating?: number;
  };

  const distribution = data.distribution?.percentages || [];
  const totalReviews = stats?.totalReviews ?? 0;
  const averageRating = stats?.averageRating ?? 0;

  console.log({ stats });

  return (
    <div className="rounded-xl border border-gray-200 p-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-3xl font-bold text-amber-600">
          {averageRating.toFixed(1)}
        </div>
        <div>
          <StarRating value={averageRating} showCount={false} size="md" />
          <p className="mt-1 text-sm text-gray-500">
            Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((rating) => {
          const row = distribution.find((d) => d.rating === rating);
          const pct = row?.percentage ?? 0;

          return (
            <div key={rating} className="flex items-center gap-3 text-sm">
              <span className="w-8 font-medium text-gray-700">{rating}</span>
              <span className="text-amber-400">★</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-12 text-right text-xs font-medium text-gray-500">
                {pct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
