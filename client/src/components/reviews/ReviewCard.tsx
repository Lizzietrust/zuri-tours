import StarRating from "./StarRating";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { Review, User } from "@/types";

export default function ReviewCard({ review }: { review: Review }) {
  const user = typeof review.user === "object" ? (review.user as User) : null;

  return (
    <article className="border-b border-gray-100 py-5 last:border-0">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {user?.name || "Anonymous"}
            </p>
            <p className="text-xs text-gray-400">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {review.isVerifiedPurchase && (
            <Badge variant="success">Verified</Badge>
          )}
          {review.isRecommended === false && (
            <Badge variant="warning">Not recommended</Badge>
          )}
        </div>
      </header>

      <div className="mt-3">
        <StarRating value={review.rating} showCount={false} size="sm" />
      </div>

      {review.title && (
        <h4 className="mt-2 text-sm font-semibold text-gray-900">
          {review.title}
        </h4>
      )}

      <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
        {review.review}
      </p>

      {review.response?.text && (
        <div className="mt-3 rounded-lg bg-emerald-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            Response from the tour team
          </p>
          <p className="mt-1 text-sm text-emerald-900">
            {review.response.text}
          </p>
        </div>
      )}

      {review.helpfulCount > 0 && (
        <p className="mt-3 text-xs text-gray-500">
          👍 {review.helpfulCount}{" "}
          {review.helpfulCount === 1 ? "person" : "people"} found this helpful
        </p>
      )}
    </article>
  );
}
