"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  useAdminTours,
  useBulkTrashTours,
  usePurgeTour,
  useRestoreTour,
  useTrashTour,
} from "@/hooks/useAdmin";
import type { AdminTour } from "@/services/admin";
import { imageUrl } from "@/services/tours";
import { formatCurrency } from "@/lib/utils";
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

type View = "active" | "trash" | "all";

type Pending =
  | { kind: "trash"; tour: AdminTour }
  | { kind: "purge"; tour: AdminTour }
  | { kind: "bulk"; ids: string[] }
  | null;

const SEARCH_DEBOUNCE_MS = 400;

export default function AdminToursPage() {
  const [view, setView] = useState<View>("active");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState<Pending>(null);

  useEffect(() => {
    const term = q.trim();
    if (term === search) return;

    const timer = setTimeout(() => {
      setSearch(term);
      setPage(1);
      setSelected([]);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [q, search]);

  const { data, isLoading, isError, refetch } = useAdminTours({
    status: view,
    q: search,
    page,
    limit: 15,
  });
  const trash = useTrashTour();
  const restore = useRestoreTour();
  const purge = usePurgeTour();
  const bulk = useBulkTrashTours();

  const tours = data?.data.tours ?? [];
  const allSelected =
    tours.length > 0 && tours.every((t) => selected.includes(t._id));
  const busy = trash.isPending || purge.isPending || bulk.isPending;

  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  const confirm = () => {
    if (!pending) return;
    const done = {
      onSuccess: () => {
        setPending(null);
        setSelected([]);
      },
    };

    if (pending.kind === "trash") trash.mutate(pending.tour._id, done);
    else if (pending.kind === "purge") purge.mutate(pending.tour._id, done);
    else bulk.mutate(pending.ids, done);
  };

  return (
    <>
      <PageHeader
        title="Tours"
        subtitle="Create, edit and manage every tour"
        action={
          <Link href="/admin/tours/new" className={BTN.primary}>
            + New tour
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs<View>
          value={view}
          onChange={(v) => {
            setView(v);
            setPage(1);
            setSelected([]);
          }}
          options={[
            { value: "active", label: "Active" },
            { value: "trash", label: "Trash" },
            { value: "all", label: "All" },
          ]}
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, city, country…"
          aria-label="Search tours"
          className={`${INPUT} w-full sm:w-72`}
        />
      </div>

      {selected.length > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          <span>{selected.length} selected</span>
          <button
            className={BTN.danger}
            onClick={() => setPending({ kind: "bulk", ids: selected })}
          >
            Move to trash
          </button>
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          Couldn&apos;t load tours.{" "}
          <button className="font-semibold underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      <TableCard>
        <thead className="bg-gray-50">
          <tr>
            <th className={TH}>
              <input
                type="checkbox"
                aria-label="Select all"
                checked={allSelected}
                onChange={() =>
                  setSelected(
                    allSelected
                      ? []
                      : tours.filter((t) => t.isActive).map((t) => t._id),
                  )
                }
                className="accent-emerald-600"
              />
            </th>
            <th className={TH}>Tour</th>
            <th className={TH}>Price</th>
            <th className={TH}>Rating</th>
            <th className={TH}>Status</th>
            <th className={`${TH} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <RowsState
            loading={isLoading}
            empty={!isLoading && tours.length === 0}
            cols={6}
            message="No tours found."
          />
          {tours.map((t) => (
            <tr key={t._id} className={t.isActive ? "" : "bg-gray-50/70"}>
              <td className={TD}>
                {t.isActive && (
                  <input
                    type="checkbox"
                    aria-label={`Select ${t.name}`}
                    checked={selected.includes(t._id)}
                    onChange={() => toggle(t._id)}
                    className="accent-emerald-600"
                  />
                )}
              </td>
              <td className={TD}>
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl(t.imageCover ?? "")}
                    alt=""
                    className="h-10 w-14 shrink-0 rounded-lg bg-gray-100 object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">
                      {t.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {[t.location?.city, t.location?.country]
                        .filter(Boolean)
                        .join(", ") || "—"}{" "}
                      · {t.duration}d · {t.difficulty}
                    </p>
                  </div>
                </div>
              </td>
              <td className={TD}>{formatCurrency(t.price)}</td>
              <td className={TD}>
                {(t.ratingsAverage ?? 0).toFixed(1)} ({t.ratingsQuantity ?? 0})
              </td>
              <td className={TD}>
                <div className="flex flex-wrap gap-1">
                  <Badge tone={t.isActive ? "green" : "red"}>
                    {t.isActive ? "active" : "trash"}
                  </Badge>
                  {t.featured && <Badge tone="amber">featured</Badge>}
                  {t.isSecret && <Badge tone="blue">secret</Badge>}
                </div>
              </td>
              <td className={`${TD} text-right`}>
                <div className="flex justify-end gap-2">
                  {t.isActive ? (
                    <>
                      <Link
                        href={`/admin/tours/${t._id}/edit`}
                        className={BTN.ghost}
                      >
                        Edit
                      </Link>
                      <button
                        className={BTN.danger}
                        onClick={() => setPending({ kind: "trash", tour: t })}
                      >
                        Trash
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className={BTN.ok}
                        disabled={restore.isPending}
                        onClick={() => restore.mutate(t._id)}
                      >
                        Restore
                      </button>
                      <button
                        className={BTN.danger}
                        onClick={() => setPending({ kind: "purge", tour: t })}
                      >
                        Delete forever
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>

      <Pagination page={page} pages={data?.pages ?? 1} onChange={setPage} />

      <ConfirmDialog
        open={pending !== null}
        loading={busy}
        title={
          pending?.kind === "purge"
            ? "Delete this tour forever?"
            : pending?.kind === "bulk"
              ? `Move ${pending.ids.length} tours to trash?`
              : "Move this tour to trash?"
        }
        description={
          pending?.kind === "purge"
            ? "This permanently deletes the tour and its reviews. It cannot be undone."
            : "Trashed tours disappear from the public site. You can restore them from the Trash tab."
        }
        confirmLabel={
          pending?.kind === "purge" ? "Delete forever" : "Move to trash"
        }
        onConfirm={confirm}
        onClose={() => !busy && setPending(null)}
      />
    </>
  );
}
