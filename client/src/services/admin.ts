import { api } from "@/lib/api";
import type { AxiosResponse } from "axios";

/* Works whether your axios instance returns the AxiosResponse or already unwraps it */
const isAxiosResponse = <T>(
  res: AxiosResponse<T> | T,
): res is AxiosResponse<T> =>
  typeof res === "object" &&
  res !== null &&
  typeof (res as AxiosResponse<T>).status === "number" &&
  "headers" in (res as object);

const body = <T>(res: AxiosResponse<T> | T): T =>
  isAxiosResponse(res) ? res.data : res;

export type PageInfo = {
  total: number;
  page: number;
  pages: number;
  results: number;
};
type Envelope<T> = PageInfo & { status: string; data: T };

export type AdminTour = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  duration: number;
  difficulty: string;
  category?: string;
  ratingsAverage?: number;
  ratingsQuantity?: number;
  imageCover?: string;
  isActive: boolean;
  featured?: boolean;
  isSecret?: boolean;
  createdAt: string;
  location?: { city?: string; country?: string };
};

export type AdminReview = {
  _id: string;
  review: string;
  title?: string;
  rating: number;
  status: string;
  createdAt: string;
  helpfulCount?: number;
  moderationNote?: string;
  flagReasons?: {
    reason: string;
    description?: string;
    flaggedBy?: { name?: string } | null;
  }[];
  user?: { _id: string; name: string; email: string } | null;
  tour?: { _id: string; name: string; slug: string } | null;
};

export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: "user" | "guide" | "lead-guide" | "admin";
  photo?: string;
  createdAt: string;
  accountDeleted?: boolean;
};

export type AdminBooking = {
  _id: string;
  bookingReference?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "refunded" | "failed";
  paymentMethod?: "paystack" | "cash";
  price: number;
  guests: number;
  startDate: string;
  createdAt: string;
  tour?: { _id: string; name: string; slug: string } | null;
  user?: { _id: string; name: string; email: string } | null;
};

export type DashboardStats = {
  users: number;
  tours: { active: number; trashed: number };
  reviews: { approved: number; removed: number; reported: number };
  bookings: {
    total: number;
    revenue: number;
    byStatus: Record<string, number>;
  };
  recentBookings: AdminBooking[];
};

type Params = Record<string, string | number | boolean | undefined>;
const clean = (p: Params) =>
  Object.fromEntries(
    Object.entries(p).filter(
      ([, v]) => v !== undefined && v !== "" && v !== "all",
    ),
  );

type TourDoc = Record<string, unknown>;

/* The API may return the tour as data, data.tour or data.document. */
const pickTour = (data: unknown): TourDoc | undefined => {
  if (!data || typeof data !== "object") return undefined;

  const d = data as Record<string, unknown>;

  if (d.tour && typeof d.tour === "object") return d.tour as TourDoc;
  if (d.document && typeof d.document === "object")
    return d.document as TourDoc;
  if ("_id" in d) return d as TourDoc;

  return undefined;
};

export const adminService = {
  async stats() {
    const res = body<{ data: DashboardStats }>(await api.get("/admin/stats"));

    return res.data;
  },

  /* ---------- tours ---------- */
  async tours(params: Params) {
    return body<Envelope<{ tours: AdminTour[] }>>(
      await api.get("/tours/admin/all", { params: clean(params) }),
    );
  },
  async tour(id: string): Promise<TourDoc> {
    const res = body<{ data: unknown }>(
      await api.get(`/tours/${id}`, {
        params: {
          populateReviews: "false",
          populateGuides: "false",
          populateLeadGuide: "false",
        },
      }),
    );

    const tour = pickTour(res.data);

    if (!tour) throw new Error("Tour data missing in response");

    return tour;
  },
  async createTour(payload: Record<string, unknown> | FormData) {
    const isForm =
      typeof FormData !== "undefined" && payload instanceof FormData;
    return body(
      await api.post("/tours", payload, {
        headers: isForm ? { "Content-Type": "multipart/form-data" } : undefined,
      }),
    );
  },
  async updateTour(id: string, payload: Record<string, unknown> | FormData) {
    const isForm =
      typeof FormData !== "undefined" && payload instanceof FormData;
    return body(
      await api.patch(`/tours/${id}`, payload, {
        headers: isForm ? { "Content-Type": "multipart/form-data" } : undefined,
      }),
    );
  },
  async trashTour(id: string) {
    return body(await api.patch(`/tours/${id}/soft-delete`));
  },
  async restoreTour(id: string) {
    return body(await api.patch(`/tours/${id}/restore`));
  },
  async purgeTour(id: string) {
    return body(await api.delete(`/tours/${id}/permanent`));
  },
  async bulkTrashTours(ids: string[]) {
    return body(await api.patch("/tours/bulk/soft-delete", { ids }));
  },

  /* ---------- reviews ---------- */
  async reviews(params: Params) {
    return body<Envelope<{ reviews: AdminReview[] }>>(
      await api.get("/reviews/admin/all", { params: clean(params) }),
    );
  },
  async removeReview(id: string, reason?: string) {
    return body(await api.delete(`/reviews/${id}`, { data: { reason } }));
  },
  async restoreReview(id: string) {
    return body(await api.patch(`/reviews/${id}/restore`));
  },
  async purgeReview(id: string) {
    return body(await api.delete(`/reviews/${id}/permanent`));
  },

  /* ---------- users ---------- */
  async users(params: Params) {
    return body<Envelope<{ users: AdminUser[] }>>(
      await api.get("/users/admin/list", { params: clean(params) }),
    );
  },
  async changeRole(id: string, role: AdminUser["role"]) {
    return body(await api.patch(`/users/${id}/role`, { role }));
  },
  async deactivateUser(id: string) {
    return body(await api.delete(`/users/${id}`));
  },
  async restoreUser(id: string) {
    return body(await api.patch(`/users/${id}/restore`));
  },

  /* ---------- bookings ---------- */
  async bookings(params: Params) {
    return body<Envelope<{ bookings: AdminBooking[] }>>(
      await api.get("/bookings", { params: clean(params) }),
    );
  },
  async updateBooking(
    id: string,
    patch: { status?: string; paymentStatus?: string },
  ) {
    return body(await api.patch(`/bookings/${id}/status`, patch));
  },
  async cancelBooking(id: string, reason?: string) {
    return body(await api.patch(`/bookings/${id}/cancel`, { reason }));
  },
};
