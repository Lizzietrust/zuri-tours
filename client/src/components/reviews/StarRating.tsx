export default function StarRating({
  value,
  count,
  size = "md",
  showCount = true,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}) {
  const dim =
    size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const rounded = Math.round(value * 2) / 2;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5 text-amber-500">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= Math.floor(rounded);
          const half = !filled && i === Math.ceil(rounded) && rounded % 1 !== 0;

          return (
            <svg key={i} viewBox="0 0 24 24" className={dim} aria-hidden="true">
              {half ? (
                <>
                  <defs>
                    <linearGradient id={`half-${i}-${value}`}>
                      <stop offset="50%" stopColor="currentColor" />
                      <stop offset="50%" stopColor="#e5e7eb" />
                    </linearGradient>
                  </defs>
                  <path
                    fill={`url(#half-${i}-${value})`}
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
                  />
                </>
              ) : (
                <path
                  fill={filled ? "currentColor" : "#e5e7eb"}
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
                />
              )}
            </svg>
          );
        })}
      </div>
      {value > 0 && (
        <span className="text-sm font-semibold text-gray-800">
          {value.toFixed(1)}
        </span>
      )}
      {showCount && typeof count === "number" && (
        <span className="text-sm text-gray-400">({count})</span>
      )}
    </div>
  );
}
