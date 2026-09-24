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

/* ---------- Response shape helpers ---------- */

type TourReviewsResponse = {
  status: string;
  results: number;
  total: number;
  page: number;
  pages: number;
  data: {
    reviews:
      | Review[]
      | {
          data: Review[];
          total: number;
          page: number;
          pages: number;
          limit: number;
        };
  };
};

type StatsResponse = {
  status: string;
  data: {
    stats: Record<string, unknown>;
    distribution: {
      distribution: { rating: number; count: number }[];
      percentages: { rating: number; count: number; percentage: number }[];
      total: number;
    };
    recentReviews?: Review[];
  };
};

/* ---------- Normalize ---------- */

function normalizeTourReviewsPayload(
  raw: TourReviewsResponse,
): ApiListResponse<Review> {
  const r = raw.data.reviews;

  if (Array.isArray(r)) {
    return {
      status: "success",
      results: raw.results ?? r.length,
      total: raw.total ?? r.length,
      page: raw.page ?? 1,
      pages: raw.pages ?? 1,
      data: { reviews: r },
    };
  }

  return {
    status: "success",
    results: r.data.length,
    total: r.total,
    page: r.page,
    pages: r.pages,
    data: { reviews: r.data },
  };
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
    const { data } = await api.get<TourReviewsResponse>(
      `/tours/${tourId}/reviews`,
      { params },
    );

    return normalizeTourReviewsPayload(data);
  },

  /* ---------- Get logged-in user's review for a tour ---------- */
  async getMyReviewForTour(tourId: string): Promise<Review | null> {
    try {
      const { data } = await api.get(`/reviews/me/${tourId}`);
      return data.data.review as Review;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404) return null;
      throw err;
    }
  },

  /* ---------- Create a new review for a tour ---------- */
  async create(tourId: string, input: CreateReviewInput): Promise<Review> {
    const { data } = await api.post(`/tours/${tourId}/reviews`, input);
    return data.data.review as Review;
  },

  /* ---------- Update own review for a tour ---------- */
  async updateMy(tourId: string, input: UpdateReviewInput): Promise<Review> {
    const { data } = await api.patch(`/reviews/me/${tourId}`, input);
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
    const { data } = await api.get<StatsResponse>(`/reviews/stats`, {
      params: { tourId },
    });

    return {
      stats: data.data.stats,
      distribution: data.data.distribution,
    };
  },
};
