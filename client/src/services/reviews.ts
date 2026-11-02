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

/* ---------- "My reviews" types ---------- */

export interface MyReviewTour {
  _id: string;
  name: string;
  slug?: string;
  price?: number;
  duration?: number;
  difficulty?: string;
  imageCover?: string;
  ratingsAverage?: number;
  ratingsQuantity?: number;
}

export interface MyReview {
  _id: string;
  rating: number;
  title?: string;
  review: string;
  isRecommended?: boolean;
  isVerifiedPurchase?: boolean;
  status: string;
  needsModeration?: boolean;
  helpfulCount?: number;
  createdAt: string;
  updatedAt?: string;
  editHistory?: { review?: string; rating?: number; editedAt?: string }[];
  response?: {
    text?: string;
    respondedAt?: string;
    respondedBy?: { name?: string; role?: string } | string;
  };
  tour: MyReviewTour | string | null;
}

export interface MyReviewsParams {
  page?: number;
  limit?: number;
  sort?: string;
  status?: string;
}

export interface MyReviewsPage {
  reviews: MyReview[];
  total: number;
  page: number;
  pages: number;
}

type MyReviewsApiResponse = {
  status: string;
  results: number;
  total: number;
  page: number;
  pages: number;
  data: { reviews: MyReview[] };
};

type TourReviewsResponse = {
  status: string;
  results: number;
  total: number;
  page: number;
  pages: number;
  data: { reviews: Review[] };
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

export const reviewService = {
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

    return {
      status: "success",
      results: data.results ?? data.data.reviews.length,
      total: data.total ?? data.data.reviews.length,
      page: data.page ?? 1,
      pages: data.pages ?? 1,
      data: { reviews: data.data.reviews || [] },
    };
  },

  /** Every review the logged-in user has written, across all tours. */
  async getMine(params?: MyReviewsParams): Promise<MyReviewsPage> {
    const { data } = await api.get<MyReviewsApiResponse>(
      "/reviews/my-reviews",
      {
        params: {
          ...params,
          populateTour: "true",
          populateResponseUser: "true",
        },
      },
    );

    const reviews = data.data?.reviews ?? [];

    return {
      reviews,
      total: data.total ?? reviews.length,
      page: data.page ?? 1,
      pages: data.pages ?? 1,
    };
  },

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

  async create(tourId: string, input: CreateReviewInput): Promise<Review> {
    const { data } = await api.post(`/tours/${tourId}/reviews`, input);
    return data.data.review as Review;
  },

  async updateMy(tourId: string, input: UpdateReviewInput): Promise<Review> {
    const { data } = await api.patch(`/reviews/me/${tourId}`, input);
    return data.data.review as Review;
  },

  async remove(reviewId: string): Promise<void> {
    await api.delete(`/reviews/${reviewId}`);
  },

  async markHelpful(reviewId: string): Promise<void> {
    await api.patch(`/reviews/${reviewId}/helpful`);
  },

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
      stats: data.data.stats || {},
      distribution: data.data.distribution || {
        distribution: [],
        percentages: [],
        total: 0,
      },
    };
  },
};
