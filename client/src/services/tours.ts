import type { Tour } from "@/types";

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
 * Normalize any of the possible backend shapes into a Tour object:
 *   1. { data: Tour }                     ← getOne / handlerFactory default
 *   2. { data: { tour: Tour } }           ← if backend ever wraps in resourceKey
 *   3. { data: { document: Tour } }       ← legacy shape
 */
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
  /** List all tours (used by useTours() on the client) */
  async getAll(): Promise<ApiListResponse> {
    const res = await fetch(`${API_URL}/tours`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    return handle<ApiListResponse>(res);
  },

  /** Fetch a single tour by slug or id — used client-side via useTour() */
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

  /**
   * Server-side fetch used ONLY for generateMetadata (SEO tags).
   * Never gates rendering, never calls notFound() — the page itself
   * always renders and fetches its own data client-side via useTour().
   */
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
