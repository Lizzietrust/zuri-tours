"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewService } from "@/services/reviews";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Input from "@/components/ui/Input";
import StarInput from "./StarInput";
import type { Review } from "@/types";

type ReviewFormValues = {
  rating: number;
  title: string;
  review: string;
  isRecommended: boolean;
};

type ReviewFormInnerProps = {
  tourId: string;
  initialReview: Review | null;
};

function ReviewFormInner({ tourId, initialReview }: ReviewFormInnerProps) {
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const [title, setTitle] = useState(initialReview?.title ?? "");
  const [reviewText, setReviewText] = useState(initialReview?.review ?? "");
  const [isRecommended, setIsRecommended] = useState(
    initialReview?.isRecommended ?? true,
  );

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditing = !!initialReview;

  /* ---------- Mutations ---------- */
  const createMutation = useMutation({
    mutationFn: (input: ReviewFormValues) =>
      reviewService.create(tourId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", tourId] });
      queryClient.invalidateQueries({ queryKey: ["my-review", tourId] });
      queryClient.invalidateQueries({ queryKey: ["review-stats", tourId] });
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      setSuccess("Review submitted successfully. Thank you!");
      setError(null);
    },
    onError: (err: { message?: string }) => {
      setError(err.message || "Failed to submit review");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: Partial<ReviewFormValues>) =>
      reviewService.updateMy(tourId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", tourId] });
      queryClient.invalidateQueries({ queryKey: ["my-review", tourId] });
      queryClient.invalidateQueries({ queryKey: ["review-stats", tourId] });
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      setSuccess("Review updated successfully.");
      setError(null);
    },
    onError: (err: { message?: string }) => {
      setError(err.message || "Failed to update review");
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (rating < 1) {
      setError("Please pick a rating.");
      return;
    }
    if (reviewText.trim().length < 5) {
      setError("Review must be at least 5 characters.");
      return;
    }
    if (reviewText.trim().length > 500) {
      setError("Review cannot exceed 500 characters.");
      return;
    }

    const payload: ReviewFormValues = {
      rating,
      title: title.trim(),
      review: reviewText.trim(),
      isRecommended,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Your rating
        </label>
        <StarInput value={rating} onChange={setRating} size="lg" />
      </div>

      <Input
        label="Title (optional)"
        type="text"
        name="title"
        maxLength={100}
        placeholder="Sum up your experience"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div>
        <label
          htmlFor="review"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Your review
        </label>
        <textarea
          id="review"
          name="review"
          required
          minLength={5}
          maxLength={500}
          rows={4}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Tell other travelers what you thought…"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
        <p className="mt-1 text-xs text-gray-500">{reviewText.length} / 500</p>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={isRecommended}
          onChange={(e) => setIsRecommended(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        I recommend this tour
      </label>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div className="flex gap-2">
        <Button type="submit" loading={isPending} size="lg">
          {isEditing ? "Update review" : "Submit review"}
        </Button>
      </div>

      {isEditing && initialReview?.status === "approved" && (
        <p className="text-xs text-gray-500">
          Updating your review will send it back for moderation.
        </p>
      )}
    </form>
  );
}

/* ----------------------------------------------------------------
   Outer wrapper — decides whether to render the form, a login
   prompt, or a loading state. Passes the review through as a
   plain prop; no local state, no effects.
   ---------------------------------------------------------------- */
export default function ReviewForm({ tourId }: { tourId: string }) {
  const { isAuthenticated } = useAuth();

  const { data: myReview, isLoading: myReviewLoading } = useQuery({
    queryKey: ["my-review", tourId],
    queryFn: () => reviewService.getMyReviewForTour(tourId),
    enabled: isAuthenticated && !!tourId,
    retry: false,
    staleTime: 1000 * 60,
  });

  /* ---------- Not logged in → prompt to log in ---------- */
  if (!isAuthenticated) {
    return (
      <Alert
        type="info"
        title="Want to leave a review?"
        message="Please log in to share your experience with this tour."
        action={
          <Link
            href={`/login?redirect=/tours`}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Log in
          </Link>
        }
      />
    );
  }

  if (myReviewLoading) {
    return <p className="text-sm text-gray-500">Loading your review…</p>;
  }

  return (
    <ReviewFormInner
      key={myReview?._id ?? "new-review"}
      tourId={tourId}
      initialReview={myReview ?? null}
    />
  );
}
