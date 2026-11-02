"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useCreateReview,
  useMyReviewForTour,
  useUpdateMyReview,
} from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import StarInput from "./StarInput";
import type { CreateReviewInput } from "@/services/reviews";
import type { Review } from "@/types";

function ReviewFormInner({
  tourId,
  initialReview,
}: {
  tourId: string;
  initialReview: Review | null;
}) {
  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const [title, setTitle] = useState(initialReview?.title ?? "");
  const [reviewText, setReviewText] = useState(initialReview?.review ?? "");
  const [isRecommended, setIsRecommended] = useState(
    initialReview?.isRecommended ?? true,
  );

  const isEditing = !!initialReview;

  const createMutation = useCreateReview(tourId);
  const updateMutation = useUpdateMyReview(tourId);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1) {
      toast.warning("Please pick a rating.", {
        description: "You must select at least 1 star.",
      });
      return;
    }
    if (reviewText.trim().length < 5) {
      toast.warning("Review too short.", {
        description: "Please write at least 5 characters.",
      });
      return;
    }

    const payload: CreateReviewInput = {
      rating,
      title: title.trim(),
      review: reviewText.trim(),
      isRecommended,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setRating(0);
          setTitle("");
          setReviewText("");
          setIsRecommended(true);
        },
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-gray-200 bg-gray-50/50 p-5 md:p-6"
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {isEditing ? "Edit your review" : "Share your experience"}
        </h3>
        <p className="text-sm text-gray-500">
          Your feedback helps other travelers make better choices.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Overall Rating <span className="text-red-500">*</span>
        </label>
        <StarInput value={rating} onChange={setRating} size="lg" />
      </div>

      <Input
        label="Review Title (optional)"
        type="text"
        name="title"
        maxLength={100}
        placeholder="Sum up your experience in a few words"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div>
        <label
          htmlFor="review"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Your Review <span className="text-red-500">*</span>
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
          placeholder="What did you enjoy most? What could be improved?"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-gray-900"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>Minimum 5 characters</span>
          <span
            className={
              reviewText.length > 500 ? "text-red-500" : "text-gray-900"
            }
          >
            {reviewText.length} / 500
          </span>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={isRecommended}
          onChange={(e) => setIsRecommended(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        I recommend this tour to others
      </label>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={isPending} className="w-full sm:w-auto">
          {isEditing ? "Update review" : "Submit review"}
        </Button>
      </div>
    </form>
  );
}

export default function ReviewForm({ tourId }: { tourId: string }) {
  const { isAuthenticated } = useAuth();

  const { data: myReview, isLoading: myReviewLoading } = useMyReviewForTour(
    tourId,
    isAuthenticated,
  );

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Want to leave a review?
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to share your experience with this tour.
        </p>
        <Link
          href={`/login?redirect=/tours/${tourId}`}
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Log in to Review
        </Link>
      </div>
    );
  }

  if (myReviewLoading) {
    return <div className="h-32 animate-pulse rounded-xl bg-gray-100" />;
  }

  return (
    <ReviewFormInner
      key={myReview?._id ?? "new-review"}
      tourId={tourId}
      initialReview={myReview ?? null}
    />
  );
}
