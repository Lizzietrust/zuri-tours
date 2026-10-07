import { api } from "@/lib/api";
import type { Tour, TourQueryParams } from "@/types";

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN ??
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v\d+\/?$/, "");

export const imageUrl = (filename?: string) => {
  if (!filename) return "/placeholder-tour.jpg";
  if (filename === "default.jpg") return "/placeholder-tour.jpg";
  if (filename.startsWith("http")) return filename;
  return `${API_ORIGIN}/img/tours/${filename}`;
};

type BackendListResponse = {
  status: string;
  results?: number;
  total?: number;
  page?: number;
  pages?: number;
  limit?: number;
  data: { tours: Tour[] } | Tour[];
};

type BackendSingleResponse = {
  status: string;
  message?: string;
  data: Tour | { tour?: Tour; document?: Tour } | null;
};

export type TourListResult = {
  status: string;
  results: number;
  total: number;
  page: number;
  pages: number;
  limit: number;
  data: { tours: Tour[] };
};

export type TourSingleResult = {
  status: string;
  data: { tour: Tour };
};

function extractTours(raw: BackendListResponse): Tour[] {
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.data && Array.isArray(raw.data.tours)) return raw.data.tours;
  return [];
}

function extractTour(raw: BackendSingleResponse | null): Tour | null {
  if (!raw || !raw.data) return null;

  const d = raw.data as unknown;

  if (typeof d === "object" && d && "_id" in d && "name" in d) {
    return d as Tour;
  }
  if (typeof d === "object" && d && "tour" in d) {
    const t = (d as { tour?: Tour }).tour;
    if (t && "_id" in t) return t;
  }
  if (typeof d === "object" && d && "document" in d) {
    const doc = (d as { document?: Tour }).document;
    if (doc && "_id" in doc) return doc;
  }
  return null;
}

export const tourService = {
  async getAll(params: TourQueryParams = {}): Promise<TourListResult> {
    const { data } = await api.get<BackendListResponse>("/tours", { params });

    const tours = extractTours(data);

    return {
      status: data.status,
      results: data.results ?? tours.length,
      total: data.total ?? tours.length,
      page: data.page ?? 1,
      pages: data.pages ?? 1,
      limit: data.limit ?? tours.length,
      data: { tours },
    };
  },

  async getFeatured(limit = 3): Promise<Tour[]> {
    const { data } = await api.get<BackendListResponse>("/tours", {
      params: { limit, sort: "-ratingsAverage" },
    });
    return extractTours(data);
  },

  async getBySlug(slug: string): Promise<TourSingleResult> {
    const { data } = await api.get<BackendSingleResponse>(
      `/tours/${encodeURIComponent(slug)}`,
    );
    const tour = extractTour(data);
    if (!tour) throw new Error("Tour data missing in response");
    return { status: data.status, data: { tour } };
  },

  /** Server-side fetch for generateMetadata. */
  async getBySlugServer(slug: string, revalidate = 300): Promise<Tour | null> {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/tours/${encodeURIComponent(
      slug,
    )}?populateReviews=false`;
    try {
      const res = await fetch(url, { next: { revalidate } });
      if (!res.ok) return null;
      const raw = (await res.json()) as BackendSingleResponse;
      return extractTour(raw);
    } catch {
      return null;
    }
  },
};

/** Build a query string — kept for server-side usage. */
export function buildTourQueryString(params: TourQueryParams = {}): string {
  const search = new URLSearchParams();

  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.difficulty) search.set("difficulty", params.difficulty);
  if (params.category) search.set("category", params.category);

  if (params.minPrice !== undefined)
    search.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined)
    search.set("maxPrice", String(params.maxPrice));
  if (params.minRating !== undefined)
    search.set("minRating", String(params.minRating));
  if (params.maxDuration !== undefined)
    search.set("maxDuration", String(params.maxDuration));

  if (params.sort) search.set("sort", params.sort);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.lat !== undefined) search.set("lat", String(params.lat));
  if (params.lng !== undefined) search.set("lng", String(params.lng));
  if (params.radius !== undefined) search.set("radius", String(params.radius));
  if (params.unit) search.set("unit", params.unit);
  if (params.sortBy) search.set("sortBy", params.sortBy);

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
