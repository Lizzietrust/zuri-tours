import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

const VARIANTS: Record<Variant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-rose-100 text-rose-800",
  info: "bg-blue-100 text-blue-800",
  neutral: "bg-slate-100 text-slate-700",
};

export default function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
