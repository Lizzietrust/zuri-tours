"use client";

interface PaginationProps {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  className?: string;
}

function pageItems(current: number, total: number): (number | "…")[] {
  const set = new Set<number>([1, total, current, current - 1, current + 1]);
  const nums = [...set]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);

  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

const base =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";

const idle =
  "border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50";

export default function Pagination({
  page,
  pages,
  onChange,
  className = "mt-10",
}: PaginationProps) {
  if (pages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={`${base} ${idle} disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white`}
      >
        ← Prev
      </button>

      {pageItems(page, pages).map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-gray-400" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            aria-label={`Page ${item}`}
            className={`${base} ${
              item === page
                ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : idle
            }`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        className={`${base} ${idle} disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white`}
      >
        Next →
      </button>
    </nav>
  );
}
