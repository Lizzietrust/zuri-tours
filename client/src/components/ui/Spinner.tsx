import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-4",
};

export default function Spinner({
  size = "md",
  className,
}: {
  size?: Size;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-emerald-200 border-t-emerald-600",
        SIZES[size],
        className,
      )}
    />
  );
}
