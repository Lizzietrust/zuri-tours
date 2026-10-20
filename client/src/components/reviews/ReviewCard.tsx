import StarRating from "./StarRating";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { Review, User } from "@/types";

export default function ReviewCard({ review }: { review: Review }) {
  const user = typeof review.user === "object" ? (review.user as User) : null;

  return (
    <article className="flex flex-col gap-3 border-b border-gray-100 pb-6 last:border-0 last:pb-0">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {user?.name || "Anonymous"}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {review.isVerifiedPurchase && (
            <Badge
              variant="success"
              className="text-[10px] uppercase tracking-wider"
            >
              Verified Purchase
            </Badge>
          )}
          {review.isRecommended === false && (
            <Badge
              variant="warning"
              className="text-[10px] uppercase tracking-wider"
            >
              Not Recommended
            </Badge>
          )}
        </div>
      </header>

      <div>
        <StarRating value={review.rating} showCount={false} size="sm" />
      </div>

      {review.title && (
        <h4 className="text-base font-semibold text-gray-900">
          {review.title}
        </h4>
      )}

      <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
        {review.review}
      </p>

      {review.response?.text && (
        <div className="mt-2 rounded-lg bg-emerald-50/50 p-4 ring-1 ring-emerald-100">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
            Response from the tour team
          </p>
          <p className="mt-1 text-sm text-emerald-900">
            {review.response.text}
          </p>
        </div>
      )}

      {review.helpfulCount > 0 && (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-gray-500">
          <span>👍</span> {review.helpfulCount}{" "}
          {review.helpfulCount === 1 ? "person" : "people"} found this helpful
        </p>
      )}
    </article>
  );
}
