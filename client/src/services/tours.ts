import { api } from "@/lib/api";
import type { Tour, ApiListResponse, ApiSingleResponse } from "@/types";

export const tourService = {
  async getAll(params?: Record<string, unknown>) {
    const { data } = await api.get<ApiListResponse<Tour>>("/tours", { params });
    return data;
  },

  async getBySlug(slug: string) {
    const { data } = await api.get<ApiSingleResponse<Tour>>(`/tours/${slug}`);
    return data.data.tour;
  },

  async search(params: Record<string, unknown>) {
    const { data } = await api.get<ApiListResponse<Tour>>("/tours/search", {
      params,
    });
    return data;
  },

  async nearBy(params: {
    lat: number;
    lng: number;
    distance?: number;
    unit?: string;
  }) {
    const { data } = await api.get<ApiListResponse<Tour>>("/tours/near", {
      params,
    });
    return data;
  },
};
