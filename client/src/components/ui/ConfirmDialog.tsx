"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const confirmStyles =
    variant === "danger"
      ? "bg-rose-600 hover:bg-rose-700 focus-visible:outline-rose-600"
      : "bg-emerald-600 hover:bg-emerald-700 focus-visible:outline-emerald-600";

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!isLoading) onCancel();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl p-0 shadow-2xl backdrop:bg-gray-900/50 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <div
          aria-hidden
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-xl ${
            variant === "danger" ? "bg-rose-100" : "bg-emerald-100"
          }`}
        >
          {variant === "danger" ? "👋" : "❓"}
        </div>

        <h2
          id="confirm-title"
          className="mt-4 text-center text-lg font-bold text-gray-900"
        >
          {title}
        </h2>

        {description && (
          <p className="mt-2 text-center text-sm text-gray-600">
            {description}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            autoFocus
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-70 ${confirmStyles}`}
          >
            {isLoading && (
              <span
                aria-hidden
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
            )}
            {isLoading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
