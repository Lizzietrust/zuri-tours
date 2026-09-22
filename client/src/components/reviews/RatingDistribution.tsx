"use client";

import { useQuery } from "@tanstack/react-query";
import { reviewService } from "@/services/reviews";
import StarRating from "./StarRating";
import Skeleton from "@/components/ui/Skeleton";

export default function RatingDistribution({ tourId }: { tourId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["review-stats", tourId],
    queryFn: () => reviewService.getStats(tourId),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    );
  }

  const stats = data?.stats as {
    totalReviews?: number;
    averageRating?: number;
  };

  const distribution = data?.distribution?.percentages || [];

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <div className="text-3xl font-bold text-gray-900">
          {(stats?.averageRating ?? 0).toFixed(1)}
        </div>
        <div>
          <StarRating
            value={stats?.averageRating ?? 0}
            showCount={false}
            size="sm"
          />
          <p className="text-xs text-gray-500">
            {stats?.totalReviews ?? 0}{" "}
            {(stats?.totalReviews ?? 0) === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((rating) => {
          const row = distribution.find((d) => d.rating === rating);
          const pct = row?.percentage ?? 0;

          return (
            <div key={rating} className="flex items-center gap-3 text-xs">
              <span className="w-3 text-gray-600">{rating}</span>
              <span className="text-amber-500">★</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-gray-100">
                <div
                  className="h-full rounded bg-amber-400 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-10 text-right text-gray-500">
                {pct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
