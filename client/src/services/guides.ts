import { api } from "@/lib/api";
import type { Guide, GuideStatistics, GuidePerformance, Tour } from "@/types";

type ApiResponse<T> = {
  status: "success";
  message?: string;
  data: T;
  count?: number;
};

type GuideResponse = ApiResponse<{ guide: Guide }>;
type StatsResponse = ApiResponse<GuideStatistics>;
type PerformanceResponse = ApiResponse<GuidePerformance>;
type ToursResponse = ApiResponse<{ tours: Tour[] }> & { count?: number };

export const guideService = {
  /* ---------- Profile ---------- */
  async getMe(): Promise<Guide> {
    const { data } = await api.get<GuideResponse>("/guides/me");
    return data.data.guide;
  },

  async updateMe(payload: Partial<Guide>): Promise<Guide> {
    const { data } = await api.patch<GuideResponse>("/guides/me", payload);
    return data.data.guide;
  },

  /* ---------- Statistics & performance ---------- */
  async getStatistics(): Promise<GuideStatistics> {
    const { data } = await api.get<StatsResponse>("/guides/me/statistics");
    return data.data;
  },

  async getPerformance(): Promise<GuidePerformance> {
    const { data } = await api.get<PerformanceResponse>(
      "/guides/me/performance",
    );
    return data.data;
  },

  /* ---------- Assigned tours ---------- */
  async getAssignedTours(params?: {
    populateGuides?: boolean;
    populateGuideDetails?: boolean;
    populateReviews?: boolean;
  }): Promise<Tour[]> {
    const query: Record<string, string> = {};
    if (params?.populateGuides !== undefined)
      query.populateGuides = String(params.populateGuides);
    if (params?.populateGuideDetails !== undefined)
      query.populateGuideDetails = String(params.populateGuideDetails);
    if (params?.populateReviews !== undefined)
      query.populateReviews = String(params.populateReviews);

    const { data } = await api.get<ToursResponse>("/tours/my-assigned-tours", {
      params: query,
    });

    return data.data.tours;
  },

  /* ---------- Public guide directory ---------- */
  async getAll(): Promise<Guide[]> {
    const { data } = await api.get<ApiResponse<{ guides: Guide[] }>>("/guides");
    return data.data.guides;
  },

  async getById(id: string): Promise<Guide> {
    const { data } = await api.get<GuideResponse>(`/guides/${id}`);
    return data.data.guide;
  },
};
