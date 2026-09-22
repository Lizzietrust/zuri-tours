import { cn } from "@/lib/utils";

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded bg-gray-200", className)}
      aria-hidden="true"
    />
  );
}
