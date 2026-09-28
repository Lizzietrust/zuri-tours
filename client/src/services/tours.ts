import type { Tour, TourQueryParams } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN || API_URL?.replace(/\/api\/v\d+\/?$/, "");

export const imageUrl = (filename?: string) => {
  if (!filename) return "/placeholder-tour.jpg";
  if (filename.startsWith("http")) return filename;
  return `${API_ORIGIN}/img/tours/${filename}`;
};

type ApiListResponse = {
  status: string;
  results?: number;
  total?: number;
  page?: number;
  pages?: number;
  data: { tours: Tour[] };
};

type RawSingleResponse = {
  status: string;
  message?: string;
  data: Tour | { tour?: Tour; document?: Tour } | null;
};

export type ApiSingleResponse = {
  status: string;
  data: { tour: Tour };
};

async function handle<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (json as { message?: string })?.message ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return json as T;
}

/**
 * Build a query string from filter params, skipping empty values.
 */
export function buildTourQueryString(params: TourQueryParams = {}): string {
  const search = new URLSearchParams();

  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.difficulty) search.set("difficulty", params.difficulty);
  if (params.category) search.set("category", params.category);

  if (params.minPrice !== undefined && params.minPrice !== null) {
    search.set("minPrice", String(params.minPrice));
  }
  if (params.maxPrice !== undefined && params.maxPrice !== null) {
    search.set("maxPrice", String(params.maxPrice));
  }
  if (params.minRating !== undefined && params.minRating !== null) {
    search.set("minRating", String(params.minRating));
  }
  if (params.maxDuration !== undefined && params.maxDuration !== null) {
    search.set("maxDuration", String(params.maxDuration));
  }

  if (params.sort) search.set("sort", params.sort);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function extractTour(raw: RawSingleResponse | null | undefined): Tour | null {
  if (!raw || !raw.data) return null;

  const d = raw.data as unknown;

  if (
    d &&
    typeof d === "object" &&
    "_id" in (d as object) &&
    "name" in (d as object)
  ) {
    return d as Tour;
  }

  if (d && typeof d === "object" && "tour" in (d as object)) {
    const t = (d as { tour?: Tour }).tour;
    if (t && "_id" in t) return t;
  }

  if (d && typeof d === "object" && "document" in (d as object)) {
    const doc = (d as { document?: Tour }).document;
    if (doc && "_id" in doc) return doc;
  }

  return null;
}

export const tourService = {
  /**
   * List tours with optional search & filters.
   * Sends both the structured params AND forwards them for the backend to use.
   */
  async getAll(params: TourQueryParams = {}): Promise<ApiListResponse> {
    const queryString = buildTourQueryString(params);
    const res = await fetch(`${API_URL}/tours${queryString}`, {
      headers: { Accept: "application/json" },
    });
    return handle<ApiListResponse>(res);
  },

  /** Fetch a single tour by slug or id */
  async getBySlug(slug: string): Promise<ApiSingleResponse> {
    const res = await fetch(
      `${API_URL}/tours/${encodeURIComponent(slug)}?populateReviews=false`,
      { headers: { Accept: "application/json" } },
    );

    const raw = await handle<RawSingleResponse>(res);
    const tour = extractTour(raw);

    if (!tour) {
      throw new Error("Tour data missing in response");
    }

    return { status: raw.status, data: { tour } };
  },

  /** Server-side fetch used ONLY for generateMetadata */
  async getBySlugServer(slug: string, revalidate = 300): Promise<Tour | null> {
    const url = `${API_URL}/tours/${encodeURIComponent(slug)}?populateReviews=false`;
    try {
      const res = await fetch(url, { next: { revalidate } });
      if (!res.ok) return null;

      const raw = (await res.json()) as RawSingleResponse;
      return extractTour(raw);
    } catch {
      return null;
    }
  },
};
