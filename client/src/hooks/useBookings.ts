"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  bookingService,
  type BookingStatus,
  type CreateBookingInput,
} from "@/services/bookings";

/* ---------- Query keys ---------- */
export const bookingKeys = {
  all: ["bookings"] as const,
  mine: (page: number, status?: BookingStatus | "all") =>
    [...bookingKeys.all, "mine", { page, status }] as const,
  one: (id: string) => [...bookingKeys.all, "one", id] as const,
};

/* ============================================================
   CREATE — returns authorization URL to redirect to Paystack
   ============================================================ */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBookingInput) => bookingService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (err: { message?: string }) => {
      toast.error("Could not start checkout", {
        description: err.message || "Please try again.",
      });
    },
  });
}

/* ============================================================
   VERIFY PAYMENT (called on the /bookings/callback page)
   ============================================================ */
export function useVerifyPayment(reference: string | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [...bookingKeys.all, "verify", reference],
    queryFn: async () => {
      const booking = await bookingService.verifyPayment(reference as string);
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      return booking;
    },
    enabled: !!reference,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });
}

/* ============================================================
   MY BOOKINGS
   ============================================================ */
export function useMyBookings(
  page = 1,
  status?: BookingStatus | "all",
  limit = 10,
) {
  return useQuery({
    queryKey: [...bookingKeys.mine(page, status), { limit }],
    queryFn: () => bookingService.getMine({ page, limit, status }),
    staleTime: 1000 * 60,
    placeholderData: (prev) => prev,
  });
}

/* ============================================================
   SINGLE
   ============================================================ */
export function useBooking(id: string | null) {
  return useQuery({
    queryKey: bookingKeys.one(id ?? ""),
    queryFn: () => bookingService.getOne(id as string),
    enabled: !!id,
    staleTime: 1000 * 60,
  });
}

/* ============================================================
   CANCEL
   ============================================================ */
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      bookingService.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      toast.success("Booking cancelled", {
        description: "Your refund will be processed shortly.",
      });
    },
    onError: (err: { message?: string }) => {
      toast.error("Cancellation failed", {
        description: err.message || "Please try again.",
      });
    },
  });
}
