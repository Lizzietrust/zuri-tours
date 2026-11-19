"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useGuideTeam, useSetTourGuide } from "@/hooks/useGuide";
import { Badge, PageHeader } from "@/components/admin/ui";

export default function TeamPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isLead = user?.role === "lead-guide";

  useEffect(() => {
    if (!authLoading && !isLead) router.replace("/guide");
  }, [authLoading, isLead, router]);

  const { data, isLoading, isError, refetch } = useGuideTeam();
  const setGuide = useSetTourGuide();

  if (!isLead) return null;

  const guideById = new Map((data?.guides ?? []).map((g) => [g._id, g]));

  return (
    <>
      <PageHeader
        title="Team"
        subtitle="Assign guides to tours. Changes apply immediately."
      />

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {isError && (
        <button
          onClick={() => refetch()}
          className="text-sm font-semibold text-emerald-700"
        >
          Couldn&apos;t load the team — try again
        </button>
      )}

      <div className="space-y-4">
        {data?.tours.map((tour) => {
          const available = data.guides.filter(
            (g) => !tour.guides.includes(g._id),
          );

          return (
            <section
              key={tour._id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <h2 className="font-semibold text-gray-900">{tour.name}</h2>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {tour.guides.length === 0 && (
                  <span className="text-sm text-gray-500">No guides yet</span>
                )}
                {tour.guides.map((gid) => {
                  const g = guideById.get(gid);

                  return (
                    <span
                      key={gid}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 py-1 pr-1 pl-3 text-xs font-semibold text-emerald-800"
                    >
                      {g?.name ?? "Unknown guide"}
                      {g?.role === "lead-guide" && (
                        <Badge tone="blue">lead</Badge>
                      )}
                      <button
                        type="button"
                        aria-label={`Remove ${g?.name ?? "guide"} from ${tour.name}`}
                        disabled={setGuide.isPending}
                        onClick={() =>
                          setGuide.mutate({
                            tourId: tour._id,
                            guideId: gid,
                            action: "unassign",
                          })
                        }
                        className="flex h-5 w-5 items-center justify-center rounded-full text-emerald-700 hover:bg-emerald-100"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}

                {available.length > 0 && (
                  <select
                    aria-label={`Add a guide to ${tour.name}`}
                    value=""
                    disabled={setGuide.isPending}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      setGuide.mutate({
                        tourId: tour._id,
                        guideId: e.target.value,
                        action: "assign",
                      });
                    }}
                    className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700"
                  >
                    <option value="">+ Add guide…</option>
                    {available.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
