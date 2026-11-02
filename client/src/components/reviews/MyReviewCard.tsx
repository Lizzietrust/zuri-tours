"use client";

import { useState } from "react";
import Link from "next/link";
import StarInput from "./StarInput";
import { imageUrl } from "@/services/tours";
import { formatDate } from "@/lib/utils";
import { useDeleteReview, useUpdateMyReview } from "@/hooks/useReviews";
import type { MyReview } from "@/services/reviews";

const STATUS_STYLES: Record<string, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  flagged: "border-amber-200 bg-amber-50 text-amber-800",
  rejected: "border-red-200 bg-red-50 text-red-700",
  hidden: "border-gray-200 bg-gray-100 text-gray-700",
};

const INPUT_CLASS =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100";

function Stars({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span
      className="text-amber-400"
      role="img"
      aria-label={`${value} out of 5 stars`}
    >
      {"★".repeat(filled)}
      <span className="text-gray-300">{"★".repeat(5 - filled)}</span>
    </span>
  );
}

function Badge({
  children,
  className = "border-gray-200 bg-gray-50 text-gray-700",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

/* ---------------------------- edit form ---------------------------- */

function EditForm({
  review,
  tourId,
  onClose,
}: {
  review: MyReview;
  tourId: string;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(review.rating);
  const [title, setTitle] = useState(review.title ?? "");
  const [text, setText] = useState(review.review);
  const [isRecommended, setIsRecommended] = useState(
    review.isRecommended ?? true,
  );
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useUpdateMyReview(tourId);

  const dirty =
    rating !== review.rating ||
    title !== (review.title ?? "") ||
    text !== review.review ||
    isRecommended !== (review.isRecommended ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1) {
      setError("Please pick at least 1 star.");
      return;
    }
    if (text.trim().length < 5) {
      setError("Your review must be at least 5 characters.");
      return;
    }
    setError(null);

    updateMutation.mutate(
      {
        rating,
        title: title.trim(),
        review: text.trim(),
        isRecommended,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Rating
        </label>
        <StarInput value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label
          htmlFor={`title-${review._id}`}
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Title (optional)
        </label>
        <input
          id={`title-${review._id}`}
          type="text"
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <div className="flex items-end justify-between">
          <label
            htmlFor={`review-${review._id}`}
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Your review
          </label>
          <span className="mb-1.5 text-xs text-gray-400">
            {text.length}/500
          </span>
        </div>
        <textarea
          id={`review-${review._id}`}
          rows={4}
          maxLength={500}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`${INPUT_CLASS} resize-none`}
        />
      </div>

      <label className="flex w-fit items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={isRecommended}
          onChange={(e) => setIsRecommended(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 accent-emerald-600"
        />
        I recommend this tour to others
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={updateMutation.isPending || !dirty}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60 disabled:shadow-none"
        >
          {updateMutation.isPending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={updateMutation.isPending}
          className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ----------------------------- the card ---------------------------- */

export default function MyReviewCard({
  review,
  onDeleted,
}: {
  review: MyReview;
  onDeleted?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteMutation = useDeleteReview();

  const tour =
    review.tour && typeof review.tour === "object" ? review.tour : null;
  const tourId =
    tour?._id ?? (typeof review.tour === "string" ? review.tour : "");
  const tourHref = tour?.slug ? `/tours/${tour.slug}` : null;

  const edited = (review.editHistory?.length ?? 0) > 0;
  const canEdit =
    !!tourId && review.status !== "rejected" && review.status !== "flagged";

  const responderName =
    review.response?.respondedBy &&
    typeof review.response.respondedBy === "object"
      ? review.response.respondedBy.name
      : undefined;

  const handleDelete = () => {
    deleteMutation.mutate(review._id, {
      onSuccess: () => {
        setConfirmDelete(false);
        onDeleted?.();
      },
    });
  };

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      {/* ---- Tour header ---- */}
      <div className="flex items-start gap-4">
        {tour?.imageCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(tour.imageCover)}
            alt=""
            className="h-16 w-24 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-2xl"
          >
            🧭
          </div>
        )}

        <div className="min-w-0 flex-1">
          {tourHref ? (
            <Link
              href={tourHref}
              className="block truncate text-lg font-semibold text-gray-900 transition hover:text-emerald-800"
            >
              {tour?.name}
            </Link>
          ) : (
            <p className="truncate text-lg font-semibold text-gray-900">
              {tour?.name ?? "Tour no longer available"}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1.5">
              <Stars value={review.rating} />
              <span className="font-semibold text-gray-800">
                {review.rating}.0
              </span>
            </span>
            <span className="text-gray-500">
              Reviewed {formatDate(review.createdAt)}
            </span>
            {edited && review.updatedAt && (
              <span className="text-gray-500">
                · Edited {formatDate(review.updatedAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ---- Badges ---- */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge
          className={`capitalize ${
            STATUS_STYLES[review.status] ?? STATUS_STYLES.hidden
          }`}
        >
          {review.status}
        </Badge>
        {review.isVerifiedPurchase && (
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">
            ✓ Verified booking
          </Badge>
        )}
        {edited && <Badge>✎ Edited</Badge>}
        {review.needsModeration && review.status === "approved" && (
          <Badge className="border-amber-200 bg-amber-50 text-amber-800">
            Pending moderation
          </Badge>
        )}
        {review.isRecommended !== undefined && (
          <Badge>
            {review.isRecommended ? "👍 Recommended" : "👎 Not recommended"}
          </Badge>
        )}
      </div>

      {/* ---- Body / edit form ---- */}
      {editing && tourId ? (
        <EditForm
          review={review}
          tourId={tourId}
          onClose={() => setEditing(false)}
        />
      ) : (
        <div className="mt-4">
          {review.title && (
            <h3 className="text-base font-semibold text-gray-900">
              {review.title}
            </h3>
          )}
          <p className="mt-1 text-sm leading-relaxed text-pretty whitespace-pre-line text-gray-700">
            {review.review}
          </p>

          {review.response?.text && (
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="text-xs font-semibold tracking-wide text-emerald-800 uppercase">
                Response from {responderName ?? "the Zuri Tours team"}
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {review.response.text}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---- Footer ---- */}
      {!editing && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <span className="text-xs text-gray-500">
            👍 {review.helpfulCount ?? 0}{" "}
            {review.helpfulCount === 1 ? "person" : "people"} found this helpful
          </span>

          {!confirmDelete ? (
            <div className="flex flex-wrap items-center gap-2">
              {tourHref && (
                <Link
                  href={tourHref}
                  className="rounded-lg px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  View tour
                </Link>
              )}
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={!canEdit}
                title={
                  canEdit
                    ? undefined
                    : "This review can't be edited in its current status"
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-red-700">Delete this review?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleteMutation.isPending}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
