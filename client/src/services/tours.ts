import { api } from "@/lib/api";
import { distanceKm, getTourCoords, type LatLng } from "@/lib/geo";
import type { Tour, TourQueryParams } from "@/types";

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN ??
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v\d+\/?$/, "") ??
  "";

export const imageUrl = (filename?: string) => {
  if (!filename) return "/placeholder-tour.jpg";
  if (filename === "default.jpg") return "/placeholder-tour.jpg";
  if (filename.startsWith("http")) return filename;
  return `${API_ORIGIN}/img/tours/${filename}`;
};

/* ============================================================
   Types
   ============================================================ */

type BackendListData = {
  tours: Tour[];
  center?: { lat: number; lng: number };
  radius?: { value?: number; unit?: string; meters?: number };
};

type BackendListResponse = {
  status: string;
  results?: number;
  total?: number;
  page?: number;
  pages?: number;
  limit?: number;
  data: BackendListData | Tour[];
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

export type NearbySort = "distance" | "price" | "ratingsAverage" | "duration";

export interface NearbyTourParams {
  lat: number;
  lng: number;
  /** Search radius in km */
  radius: number;
  sortBy?: NearbySort;
  difficulty?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxDuration?: number;
  page?: number;
  limit?: number;
}

export interface NearbyTourResult {
  status: string;
  tours: Tour[];
  total: number;
  page: number;
  pages: number;
  center?: { lat: number; lng: number };
  radius?: { value?: number; unit?: string; meters?: number };
}

/* ============================================================
   Helpers
   ============================================================ */

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

/**
 * Normalise the distance on a tour to kilometres so the UI never has to guess
 * the unit. Prefers the backend's `distanceInMeters`; falls back to computing
 * it from the tour's coordinates.
 */
function withDistanceKm(tour: Tour, origin: LatLng): Tour {
  let km: number | undefined;

  if (
    typeof tour.distanceInMeters === "number" &&
    Number.isFinite(tour.distanceInMeters)
  ) {
    km = tour.distanceInMeters / 1000;
  } else {
    const coords = getTourCoords(tour.location);
    if (coords) km = distanceKm(origin, coords);
  }

  return km === undefined
    ? tour
    : { ...tour, distance: km, distanceUnit: "km" };
}

/* ============================================================
   Service
   ============================================================ */

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

  /**
   * Geo search. The backend does the filtering, sorting and pagination
   * (`GET /tours?lat&lng&radius&unit&sortBy&page&limit`).
   */
  async getNearby(params: NearbyTourParams): Promise<NearbyTourResult> {
    const { data } = await api.get<BackendListResponse>("/tours", {
      params: {
        lat: params.lat,
        lng: params.lng,
        radius: params.radius,
        unit: "km",
        sortBy: params.sortBy ?? "distance",
        difficulty: params.difficulty || undefined,
        category: params.category || undefined,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        minRating: params.minRating,
        maxDuration: params.maxDuration,
        page: params.page ?? 1,
        limit: params.limit ?? 9,
      },
    });

    const origin: LatLng = { lat: params.lat, lng: params.lng };
    const tours = extractTours(data).map((t) => withDistanceKm(t, origin));
    const details = Array.isArray(data.data) ? undefined : data.data;

    return {
      status: data.status,
      tours,
      total: data.total ?? tours.length,
      page: data.page ?? 1,
      pages: data.pages ?? 1,
      center: details?.center,
      radius: details?.radius,
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
