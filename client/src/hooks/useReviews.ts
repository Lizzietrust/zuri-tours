"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  reviewService,
  type CreateReviewInput,
  type MyReviewsParams,
  type UpdateReviewInput,
} from "@/services/reviews";

/* ------------------------------------------------------------------ */
/* Cache invalidation shared by every review mutation                  */
/* ------------------------------------------------------------------ */
function useInvalidateReviews() {
  const queryClient = useQueryClient();

  return (tourId?: string) => {
    queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
    queryClient.invalidateQueries({
      queryKey: tourId ? ["reviews", tourId] : ["reviews"],
    });
    queryClient.invalidateQueries({
      queryKey: tourId ? ["my-review", tourId] : ["my-review"],
    });
    queryClient.invalidateQueries({
      queryKey: tourId ? ["review-stats", tourId] : ["review-stats"],
    });
    queryClient.invalidateQueries({ queryKey: ["tour"] });
  };
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/** Public/visible reviews for one tour (paginated + sortable). */
export function useTourReviews(
  tourId: string,
  params: { page?: number; limit?: number; sort?: string } = {},
) {
  return useQuery({
    queryKey: ["reviews", tourId, params],
    queryFn: () => reviewService.getForTour(tourId, params),
    enabled: !!tourId,
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60,
  });
}

/** The logged-in user's review for a single tour (or null). */
export function useMyReviewForTour(tourId: string, enabled = true) {
  return useQuery({
    queryKey: ["my-review", tourId],
    queryFn: () => reviewService.getMyReviewForTour(tourId),
    enabled: enabled && !!tourId,
    retry: false,
    staleTime: 1000 * 60,
  });
}

/** Every review the logged-in user has written (paginated). */
export function useMyReviews(params: MyReviewsParams = {}) {
  return useQuery({
    queryKey: ["my-reviews", params],
    queryFn: () => reviewService.getMine(params),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 30,
  });
}

/** Rating stats + distribution for a tour. */
export function useReviewStats(tourId: string) {
  return useQuery({
    queryKey: ["review-stats", tourId],
    queryFn: () => reviewService.getStats(tourId),
    enabled: !!tourId,
    staleTime: 1000 * 60,
  });
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export function useCreateReview(tourId: string) {
  const invalidate = useInvalidateReviews();

  return useMutation({
    mutationFn: (input: CreateReviewInput) =>
      reviewService.create(tourId, input),
    onSuccess: () => {
      invalidate(tourId);
      toast.success("Review published!", {
        description: "Thanks for sharing — your feedback is now live.",
      });
    },
    onError: (err: { message?: string }) => {
      toast.error("Failed to submit review", {
        description: err.message || "Please try again.",
      });
    },
  });
}

export function useUpdateMyReview(tourId: string) {
  const invalidate = useInvalidateReviews();

  return useMutation({
    mutationFn: (input: UpdateReviewInput) =>
      reviewService.updateMy(tourId, input),
    onSuccess: () => {
      invalidate(tourId);
      toast.success("Review updated!", {
        description: "Your changes are live.",
      });
    },
    onError: (err: { message?: string }) => {
      toast.error("Failed to update review", {
        description: err.message || "Please try again.",
      });
    },
  });
}

export function useDeleteReview() {
  const invalidate = useInvalidateReviews();

  return useMutation({
    mutationFn: (reviewId: string) => reviewService.remove(reviewId),
    onSuccess: () => {
      invalidate();
      toast.success("Review deleted", {
        description: "Your review has been removed.",
      });
    },
    onError: (err: { message?: string }) => {
      toast.error("Failed to delete review", {
        description: err.message || "Please try again.",
      });
    },
  });
}

export function useMarkHelpful(tourId: string) {
  const invalidate = useInvalidateReviews();

  return useMutation({
    mutationFn: (reviewId: string) => reviewService.markHelpful(reviewId),
    onSuccess: () => invalidate(tourId),
    onError: (err: { message?: string }) => {
      toast.error("Couldn't mark as helpful", {
        description: err.message || "Please try again.",
      });
    },
  });
}
