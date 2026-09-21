import { cn } from "@/lib/utils";

export type AuthAlertType = "error" | "success" | "info";

export default function AuthAlert({
  type = "error",
  message,
}: {
  type?: AuthAlertType;
  message: string;
}) {
  const styles: Record<AuthAlertType, string> = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={cn("rounded-lg border px-3 py-2 text-sm", styles[type])}
    >
      {message}
    </div>
  );
}
