import { api } from "@/lib/api";
import type { Tour } from "@/types";

/* ---------- Types ---------- */

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "refunded";

export type PaymentStatus = "unpaid" | "paid" | "refunded" | "failed";

export type PaymentMethod =
  | "paystack"
  | "card"
  | "bank_transfer"
  | "ussd"
  | "cash";

export type Booking = {
  _id: string;
  tour: Pick<
    Tour,
    | "_id"
    | "name"
    | "slug"
    | "imageCover"
    | "price"
    | "priceDiscount"
    | "duration"
    | "difficulty"
  >;
  user:
    | string
    | { _id: string; name: string; email: string; profileImage?: string };
  price: number;
  currency: string;
  guests: number;
  startDate: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  bookingReference: string;
  paystackReference?: string;
  notes?: string;
  paidAt?: string;
  canCancel?: boolean;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateBookingInput = {
  tourId: string;
  guests: number;
  startDate: string;
  notes?: string;
};

export type CreateBookingResponse = {
  booking: Booking;
  payment: {
    authorizationUrl: string;
    accessCode: string;
    reference: string;
  };
};

export type BookingListResponse = {
  status: string;
  results: number;
  total: number;
  page: number;
  pages: number;
  data: { bookings: Booking[] };
};

/* ---------- Service ---------- */

export const bookingService = {
  async create(input: CreateBookingInput): Promise<CreateBookingResponse> {
    const { data } = await api.post("/bookings", input);
    return data.data as CreateBookingResponse;
  },

  async verifyPayment(reference: string): Promise<Booking> {
    const { data } = await api.get(
      `/bookings/verify/${encodeURIComponent(reference)}`,
    );
    return data.data.booking as Booking;
  },

  async getMine(params?: {
    page?: number;
    limit?: number;
    status?: BookingStatus | "all";
  }): Promise<BookingListResponse> {
    const { data } = await api.get<BookingListResponse>("/bookings/me", {
      params,
    });
    return data;
  },

  async getOne(id: string): Promise<Booking> {
    const { data } = await api.get(`/bookings/${id}`);
    return data.data.booking as Booking;
  },

  async cancel(id: string, reason?: string): Promise<Booking> {
    const { data } = await api.patch(`/bookings/${id}/cancel`, { reason });
    return data.data.booking as Booking;
  },
};
