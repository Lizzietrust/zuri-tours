// src/services/tours.ts
import type { Tour } from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:8000/api/v1";

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN || API_URL.replace(/\/api\/v\d+\/?$/, "");

export const imageUrl = (filename?: string) => {
  if (!filename) return "/placeholder.jpg";
  if (filename.startsWith("http")) return filename;
  return `${API_ORIGIN}/img/tours/${filename}`;
};

type ApiListResponse = {
  status: string;
  results?: number;
  data: { tours: Tour[] };
};

type ApiSingleResponse = {
  status: string;
  data: { tour?: Tour; document?: Tour };
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

export const tourService = {
  /** List all tours (browser or server) */
  async getAll(): Promise<ApiListResponse> {
    const res = await fetch(`${API_URL}/tours`, {
      headers: { Accept: "application/json" },
    });
    return handle<ApiListResponse>(res);
  },

  /** Fetch a single tour by slug or id (browser side) */
  async getBySlug(slug: string): Promise<ApiSingleResponse> {
    const res = await fetch(
      `${API_URL}/tours/${encodeURIComponent(slug)}?populateReviews=false`,
      { headers: { Accept: "application/json" } },
    );
    return handle<ApiSingleResponse>(res);
  },

  /** Server-side fetch with ISR revalidation */
  async getBySlugServer(slug: string, revalidate = 300): Promise<Tour | null> {
    try {
      const res = await fetch(
        `${API_URL}/tours/${encodeURIComponent(slug)}?populateReviews=false`,
        { next: { revalidate } },
      );
      if (!res.ok) return null;

      const json = (await res.json()) as ApiSingleResponse;
      return (json?.data?.tour ?? json?.data?.document ?? null) as Tour | null;
    } catch {
      return null;
    }
  },
};
