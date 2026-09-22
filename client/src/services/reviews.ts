import { api } from "@/lib/api";
import type { Review, ApiListResponse } from "@/types";

export interface CreateReviewInput {
  review: string;
  rating: number;
  title?: string;
  isRecommended?: boolean;
}

export interface UpdateReviewInput {
  review?: string;
  rating?: number;
  title?: string;
  isRecommended?: boolean;
}

export const reviewService = {
  /* ---------- List reviews for a tour ---------- */
  async getForTour(
    tourId: string,
    params?: {
      page?: number;
      limit?: number;
      sort?: string;
      minRating?: number;
      maxRating?: number;
      helpful?: boolean;
    },
  ): Promise<ApiListResponse<Review>> {
    const { data } = await api.get<ApiListResponse<Review>>(
      `/tours/${tourId}/reviews`,
      { params },
    );
    return data;
  },

  /* ---------- Get logged-in user's review for a tour ---------- */
  async getMyReviewForTour(tourId: string): Promise<Review | null> {
    try {
      const { data } = await api.get(`/tours/${tourId}/reviews/me`);
      return data.data.review as Review;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404) return null;
      throw err;
    }
  },

  /* ---------- Create a new review ---------- */
  async create(tourId: string, input: CreateReviewInput): Promise<Review> {
    const { data } = await api.post(`/tours/${tourId}/reviews`, input);
    return data.data.review as Review;
  },

  /* ---------- Update own review for a tour ---------- */
  async updateMy(tourId: string, input: UpdateReviewInput): Promise<Review> {
    const { data } = await api.patch(`/tours/${tourId}/reviews/me`, input);
    return data.data.review as Review;
  },

  /* ---------- Delete a review ---------- */
  async remove(reviewId: string): Promise<void> {
    await api.delete(`/reviews/${reviewId}`);
  },

  /* ---------- Mark as helpful ---------- */
  async markHelpful(reviewId: string): Promise<void> {
    await api.patch(`/reviews/${reviewId}/helpful`);
  },

  /* ---------- Review stats for a tour ---------- */
  async getStats(tourId: string): Promise<{
    stats: Record<string, unknown>;
    distribution: {
      distribution: { rating: number; count: number }[];
      percentages: { rating: number; count: number; percentage: number }[];
      total: number;
    };
  }> {
    const { data } = await api.get(`/reviews/stats`, {
      params: { tourId },
    });
    return data.data;
  },
};
