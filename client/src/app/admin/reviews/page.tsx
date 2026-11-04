"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useAdminReviews,
  usePurgeReview,
  useRemoveReview,
  useRestoreReview,
} from "@/hooks/useAdmin";
import type { AdminReview } from "@/services/admin";
import { formatDate } from "@/lib/utils";
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
  Tabs,
} from "@/components/admin/ui";

type View = "approved" | "removed" | "all";
type Pending = { kind: "remove" | "purge"; review: AdminReview } | null;

export default function AdminReviewsPage() {
  const [view, setView] = useState<View>("approved");
  const [reportedOnly, setReportedOnly] = useState(false);
  const [rating, setRating] = useState("all");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<Pending>(null);

  const { data, isLoading, isError, refetch } = useAdminReviews({
    status: view,
    rating,
    q: search,
    flagged: reportedOnly ? "true" : undefined,
    page,
    limit: 15,
  });
  const remove = useRemoveReview();
  const restore = useRestoreReview();
  const purge = usePurgeReview();

  const reviews = data?.data.reviews ?? [];
  const busy = remove.isPending || purge.isPending;

  const confirm = (reason: string) => {
    if (!pending) return;
    const done = { onSuccess: () => setPending(null) };

    if (pending.kind === "remove")
      remove.mutate({ id: pending.review._id, reason }, done);
    else purge.mutate(pending.review._id, done);
  };

  return (
    <>
      <PageHeader
        title="Reviews"
        subtitle="Reviews go live instantly. Remove the ones that break your rules; you can restore them anytime."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs<View>
          value={view}
          onChange={(v) => {
            setView(v);
            setPage(1);
          }}
          options={[
            { value: "approved", label: "Live" },
            { value: "removed", label: "Removed" },
            { value: "all", label: "All" },
          ]}
        />
        <select
          aria-label="Rating"
          value={rating}
          onChange={(e) => {
            setRating(e.target.value);
            setPage(1);
          }}
          className={INPUT}
        >
          <option value="all">Any rating</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} ★
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={reportedOnly}
            onChange={(e) => {
              setReportedOnly(e.target.checked);
              setPage(1);
            }}
            className="accent-emerald-600"
          />
          Reported only
        </label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(q.trim());
            setPage(1);
          }}
          className="ml-auto flex gap-2"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search review text…"
            aria-label="Search reviews"
            className={`${INPUT} w-56`}
          />
          <button className={BTN.ghost}>Search</button>
        </form>
      </div>

      {isError && (
        <div
          role="alert"
          className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          Couldn&apos;t load reviews.{" "}
          <button className="font-semibold underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      <TableCard>
        <thead className="bg-gray-50">
          <tr>
            <th className={TH}>Review</th>
            <th className={TH}>Author</th>
            <th className={TH}>Tour</th>
            <th className={TH}>Status</th>
            <th className={`${TH} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <RowsState
            loading={isLoading}
            empty={!isLoading && reviews.length === 0}
            cols={5}
            message="No reviews match these filters."
          />
          {reviews.map((r) => {
            const reports = r.flagReasons?.length ?? 0;

            return (
              <tr
                key={r._id}
                className={r.status === "removed" ? "bg-gray-50/70" : ""}
              >
                <td className={`${TD} max-w-sm`}>
                  <p
                    className="text-amber-500"
                    aria-label={`${r.rating} out of 5`}
                  >
                    {"★".repeat(Math.round(r.rating))}
                    <span className="text-gray-300">
                      {"★".repeat(5 - Math.round(r.rating))}
                    </span>
                  </p>
                  {r.title && (
                    <p className="font-semibold text-gray-900">{r.title}</p>
                  )}
                  <p className="line-clamp-3 text-gray-700">{r.review}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(r.createdAt)}
                  </p>
                  {r.moderationNote && r.status === "removed" && (
                    <p className="mt-1 text-xs text-rose-600">
                      Reason: {r.moderationNote}
                    </p>
                  )}
                </td>
                <td className={TD}>
                  <p className="font-medium">
                    {r.user?.name ?? "Deleted user"}
                  </p>
                  <p className="text-xs text-gray-500">{r.user?.email}</p>
                </td>
                <td className={TD}>
                  {r.tour ? (
                    <Link
                      href={`/tours/${r.tour.slug}`}
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      {r.tour.name}
                    </Link>
                  ) : (
                    <span className="text-gray-400">Unavailable tour</span>
                  )}
                </td>
                <td className={TD}>
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={r.status === "removed" ? "red" : "green"}>
                      {r.status === "removed" ? "removed" : "live"}
                    </Badge>
                    {reports > 0 && (
                      <span
                        title={r.flagReasons?.map((f) => f.reason).join(", ")}
                      >
                        <Badge tone="amber">
                          {reports} report{reports > 1 ? "s" : ""}
                        </Badge>
                      </span>
                    )}
                  </div>
                </td>
                <td className={`${TD} text-right`}>
                  <div className="flex justify-end gap-2">
                    {r.status === "removed" ? (
                      <>
                        <button
                          className={BTN.ok}
                          disabled={restore.isPending}
                          onClick={() => restore.mutate(r._id)}
                        >
                          Restore
                        </button>
                        <button
                          className={BTN.danger}
                          onClick={() =>
                            setPending({ kind: "purge", review: r })
                          }
                        >
                          Delete forever
                        </button>
                      </>
                    ) : (
                      <button
                        className={BTN.danger}
                        onClick={() =>
                          setPending({ kind: "remove", review: r })
                        }
                      >
                        Remove
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
        open={pending !== null}
        loading={busy}
        withReason={pending?.kind === "remove"}
        title={
          pending?.kind === "purge"
            ? "Delete this review forever?"
            : "Remove this review?"
        }
        description={
          pending?.kind === "purge"
            ? "This can't be undone."
            : "It will disappear from the tour page and the tour's rating will be recalculated. You can restore it later."
        }
        confirmLabel={
          pending?.kind === "purge" ? "Delete forever" : "Remove review"
        }
        onConfirm={confirm}
        onClose={() => !busy && setPending(null)}
      />
    </>
  );
}
