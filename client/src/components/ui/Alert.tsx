import { cn } from "@/lib/utils";

export type AlertType = "error" | "success" | "info" | "warning";

export default function Alert({
  type = "info",
  title,
  message,
  action,
}: {
  type?: AlertType;
  title?: string;
  message: string;
  action?: React.ReactNode;
}) {
  const styles: Record<AlertType, string> = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  };

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={cn(
        "flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        styles[type],
      )}
    >
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <p className={cn("text-sm", title && "mt-0.5 opacity-90")}>{message}</p>
      </div>
      {action}
    </div>
  );
}
