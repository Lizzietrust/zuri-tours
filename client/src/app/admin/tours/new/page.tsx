"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSaveTour } from "@/hooks/useAdmin";
import TourForm from "@/components/admin/TourForm";
import { PageHeader } from "@/components/admin/ui";

export default function NewTourPage() {
  const router = useRouter();
  const save = useSaveTour();

  return (
    <>
      <PageHeader
        title="New tour"
        action={
          <Link
            href="/admin/tours"
            className="text-sm font-semibold text-emerald-700"
          >
            ← Back to tours
          </Link>
        }
      />
      <TourForm
        submitting={save.isPending}
        onSubmit={(payload) =>
          save.mutate(
            { payload },
            { onSuccess: () => router.push("/admin/tours") },
          )
        }
      />
    </>
  );
}
