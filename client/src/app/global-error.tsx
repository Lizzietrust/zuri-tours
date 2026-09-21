"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-bold">Unexpected error</h1>
          <p className="mt-2 text-sm text-gray-600">{error.message}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 text-white"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
