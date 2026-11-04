"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { adminService, type AdminUser } from "@/services/admin";

type P = Record<string, string | number | boolean | undefined>;

function useAdminMutation<A, R>(
  fn: (args: A) => Promise<R>,
  success: string,
  keys: string[][],
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(success);
      keys.forEach((queryKey) => qc.invalidateQueries({ queryKey }));
    },
    onError: (err) =>
      toast.error("Action failed", {
        description:
          (err as { message?: string })?.message || "Something went wrong",
      }),
  });
}

const TOURS = [["admin", "tours"], ["tours"], ["admin", "stats"]];
const REVIEWS = [
  ["admin", "reviews"],
  ["reviews"],
  ["tours"],
  ["admin", "stats"],
];
const USERS = [
  ["admin", "users"],
  ["admin", "stats"],
];
const BOOKINGS = [["admin", "bookings"], ["bookings"], ["admin", "stats"]];

/* ---------- queries ---------- */
export const useAdminStats = () =>
  useQuery({ queryKey: ["admin", "stats"], queryFn: adminService.stats });

export const useAdminTours = (params: P) =>
  useQuery({
    queryKey: ["admin", "tours", params],
    queryFn: () => adminService.tours(params),
    placeholderData: keepPreviousData,
  });

export const useAdminTour = (id: string) =>
  useQuery({
    queryKey: ["admin", "tour", id],
    queryFn: () => adminService.tour(id),
  });

export const useAdminReviews = (params: P) =>
  useQuery({
    queryKey: ["admin", "reviews", params],
    queryFn: () => adminService.reviews(params),
    placeholderData: keepPreviousData,
  });

export const useAdminUsers = (params: P) =>
  useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => adminService.users(params),
    placeholderData: keepPreviousData,
  });

export const useAdminBookings = (params: P) =>
  useQuery({
    queryKey: ["admin", "bookings", params],
    queryFn: () => adminService.bookings(params),
    placeholderData: keepPreviousData,
  });

/* ---------- mutations ---------- */
export const useTrashTour = () =>
  useAdminMutation(
    (id: string) => adminService.trashTour(id),
    "Tour moved to trash",
    TOURS,
  );
export const useRestoreTour = () =>
  useAdminMutation(
    (id: string) => adminService.restoreTour(id),
    "Tour restored",
    TOURS,
  );
export const usePurgeTour = () =>
  useAdminMutation(
    (id: string) => adminService.purgeTour(id),
    "Tour deleted forever",
    TOURS,
  );
export const useBulkTrashTours = () =>
  useAdminMutation(
    (ids: string[]) => adminService.bulkTrashTours(ids),
    "Tours moved to trash",
    TOURS,
  );
export const useSaveTour = () =>
  useAdminMutation(
    (a: { id?: string; payload: Record<string, unknown> }) =>
      a.id
        ? adminService.updateTour(a.id, a.payload)
        : adminService.createTour(a.payload),
    "Tour saved",
    TOURS,
  );

export const useRemoveReview = () =>
  useAdminMutation(
    (a: { id: string; reason?: string }) =>
      adminService.removeReview(a.id, a.reason),
    "Review removed",
    REVIEWS,
  );
export const useRestoreReview = () =>
  useAdminMutation(
    (id: string) => adminService.restoreReview(id),
    "Review restored",
    REVIEWS,
  );
export const usePurgeReview = () =>
  useAdminMutation(
    (id: string) => adminService.purgeReview(id),
    "Review deleted forever",
    REVIEWS,
  );

export const useChangeRole = () =>
  useAdminMutation(
    (a: { id: string; role: AdminUser["role"] }) =>
      adminService.changeRole(a.id, a.role),
    "Role updated",
    USERS,
  );
export const useDeactivateUser = () =>
  useAdminMutation(
    (id: string) => adminService.deactivateUser(id),
    "User deactivated",
    USERS,
  );
export const useRestoreUser = () =>
  useAdminMutation(
    (id: string) => adminService.restoreUser(id),
    "User restored",
    USERS,
  );

export const useUpdateBooking = () =>
  useAdminMutation(
    (a: { id: string; status?: string; paymentStatus?: string }) =>
      adminService.updateBooking(a.id, {
        status: a.status,
        paymentStatus: a.paymentStatus,
      }),
    "Booking updated",
    BOOKINGS,
  );
export const useAdminCancelBooking = () =>
  useAdminMutation(
    (a: { id: string; reason?: string }) =>
      adminService.cancelBooking(a.id, a.reason),
    "Booking cancelled",
    BOOKINGS,
  );
