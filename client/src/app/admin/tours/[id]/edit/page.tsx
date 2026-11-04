"use client";

import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useAdminTour, useSaveTour } from "@/hooks/useAdmin";
import TourForm from "@/components/admin/TourForm";
import { PageHeader } from "@/components/admin/ui";

export default function EditTourPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, isError } = useAdminTour(id);
  const save = useSaveTour();

  return (
    <>
      <PageHeader
        title="Edit tour"
        action={
          <Link
            href="/admin/tours"
            className="text-sm font-semibold text-emerald-700"
          >
            ← Back to tours
          </Link>
        }
      />
      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {isError && (
        <p
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          Couldn&apos;t load this tour. If it&apos;s in the trash, restore it
          first.
        </p>
      )}
      {data && (
        <TourForm
          initial={data}
          submitting={save.isPending}
          onSubmit={(payload) =>
            save.mutate(
              { id, payload },
              { onSuccess: () => router.push("/admin/tours") },
            )
          }
        />
      )}
    </>
  );
}
