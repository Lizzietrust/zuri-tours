"use client";

import { useState } from "react";
import {
  useAdminBookings,
  useAdminCancelBooking,
  useUpdateBooking,
} from "@/hooks/useAdmin";
import type { AdminBooking } from "@/services/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import {
  BTN,
  Badge,
  ConfirmDialog,
  INPUT,
  PageHeader,
  RowsState,
  TD,
  TH,
  TableCard,
} from "@/components/admin/ui";

const statusTone = (s: string) =>
  s === "confirmed" || s === "paid"
    ? "green"
    : s === "pending" || s === "unpaid"
      ? "amber"
      : s === "cancelled" || s === "failed" || s === "refunded"
        ? "red"
        : "gray";

export default function AdminBookingsPage() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<AdminBooking | null>(null);

  const { data, isLoading, isError, refetch } = useAdminBookings({
    status,
    page,
    limit: 15,
  });
  const update = useUpdateBooking();
  const cancel = useAdminCancelBooking();

  const bookings = data?.data.bookings ?? [];

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Confirm cash bookings, mark payments and handle cancellations"
      />

      <div className="mb-4">
        <select
          aria-label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className={INPUT}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isError && (
        <div
          role="alert"
          className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          Couldn&apos;t load bookings.{" "}
          <button className="font-semibold underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      <TableCard>
        <thead className="bg-gray-50">
          <tr>
            <th className={TH}>Booking</th>
            <th className={TH}>Customer</th>
            <th className={TH}>Trip</th>
            <th className={TH}>Total</th>
            <th className={TH}>Status</th>
            <th className={`${TH} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <RowsState
            loading={isLoading}
            empty={!isLoading && bookings.length === 0}
            cols={6}
            message="No bookings found."
          />
          {bookings.map((b) => {
            const open = b.status === "pending" || b.status === "confirmed";
            const cashUnpaid =
              b.paymentMethod === "cash" &&
              b.paymentStatus === "unpaid" &&
              open;

            return (
              <tr key={b._id}>
                <td className={TD}>
                  <p className="font-semibold text-gray-900">
                    {b.tour?.name ?? "Deleted tour"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Ref: {b.bookingReference ?? b._id.slice(-6)}
                  </p>
                </td>
                <td className={TD}>
                  <p>{b.user?.name ?? "Unknown"}</p>
                  <p className="text-xs text-gray-500">{b.user?.email}</p>
                </td>
                <td className={TD}>
                  <p>{formatDate(b.startDate)}</p>
                  <p className="text-xs text-gray-500">
                    {b.guests} guest{b.guests > 1 ? "s" : ""}
                  </p>
                </td>
                <td className={TD}>
                  <p className="font-semibold text-emerald-700">
                    {formatCurrency(b.price)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {b.paymentMethod ?? "—"}
                  </p>
                </td>
                <td className={TD}>
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={statusTone(b.status)}>{b.status}</Badge>
                    <Badge tone={statusTone(b.paymentStatus)}>
                      {b.paymentStatus}
                    </Badge>
                  </div>
                </td>
                <td className={`${TD} text-right`}>
                  <div className="flex flex-wrap justify-end gap-2">
                    {b.status === "pending" && !cashUnpaid && (
                      <button
                        className={BTN.ok}
                        disabled={update.isPending}
                        onClick={() =>
                          update.mutate({ id: b._id, status: "confirmed" })
                        }
                      >
                        Confirm
                      </button>
                    )}
                    {cashUnpaid && (
                      <button
                        className={BTN.ok}
                        disabled={update.isPending}
                        onClick={() =>
                          update.mutate({
                            id: b._id,
                            paymentStatus: "paid",
                            status:
                              b.status === "pending" ? "confirmed" : undefined,
                          })
                        }
                      >
                        Mark paid
                      </button>
                    )}
                    {b.status === "confirmed" && (
                      <button
                        className={BTN.ghost}
                        disabled={update.isPending}
                        onClick={() =>
                          update.mutate({ id: b._id, status: "completed" })
                        }
                      >
                        Complete
                      </button>
                    )}
                    {open && (
                      <button
                        className={BTN.danger}
                        onClick={() => setCancelTarget(b)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableCard>

      <Pagination page={page} pages={data?.pages ?? 1} onChange={setPage} />

      <ConfirmDialog
        open={cancelTarget !== null}
        loading={cancel.isPending}
        withReason
        title="Cancel this booking?"
        description={
          <>
            <p>This releases the customer&apos;s spot.</p>
            {cancelTarget?.paymentStatus === "paid" && (
              <p className="mt-2 font-medium text-amber-700">
                It will be marked as refunded, but the money is not returned
                automatically. Refund it from your Paystack dashboard.
              </p>
            )}
          </>
        }
        confirmLabel="Cancel booking"
        onConfirm={(reason) =>
          cancelTarget &&
          cancel.mutate(
            { id: cancelTarget._id, reason },
            { onSuccess: () => setCancelTarget(null) },
          )
        }
        onClose={() => !cancel.isPending && setCancelTarget(null)}
      />
    </>
  );
}
