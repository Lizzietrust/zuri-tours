type AnyRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is AnyRecord =>
  typeof v === "object" && v !== null;

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;

/** Message the backend sent with a successful response, else the fallback. */
export function getSuccessMessage(res: unknown, fallback: string): string {
  if (isRecord(res)) {
    const direct = str(res.message);
    if (direct) return direct;

    if (isRecord(res.data)) {
      const nested = str(res.data.message);
      if (nested) return nested;
    }
  }

  return fallback;
}

function collectDetails(errors: unknown): string[] {
  const pick = (e: unknown): string | undefined => {
    if (str(e)) return str(e);
    if (isRecord(e)) return str(e.message) ?? str(e.msg);

    return undefined;
  };

  const list = Array.isArray(errors)
    ? errors
    : isRecord(errors)
      ? Object.values(errors)
      : [];

  return list.map(pick).filter((m): m is string => !!m);
}

export type ApiErrorInfo = { message: string; details: string[] };

/** Message (and any per-field details) the backend sent with an error. */
export function getApiError(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): ApiErrorInfo {
  const e: AnyRecord = isRecord(err) ? err : {};
  const response = isRecord(e.response) ? e.response : undefined;
  const rawData = response?.data;
  const data: AnyRecord = isRecord(rawData)
    ? rawData
    : isRecord(e.data)
      ? e.data
      : {};

  if (
    !response &&
    (e.code === "ERR_NETWORK" || e.message === "Network Error")
  ) {
    return {
      message: "Can't reach the server. Check your connection and try again.",
      details: [],
    };
  }

  const axiosGeneric = str(e.message)?.startsWith("Request failed with status");
  const message =
    str(data.message) ??
    (axiosGeneric ? undefined : str(e.message)) ??
    fallback;

  const all = collectDetails(data.errors ?? data.details).filter(
    (d) => d !== message,
  );
  const shown = all.slice(0, 4);

  if (all.length > shown.length)
    shown.push(`+${all.length - shown.length} more`);

  return { message, details: shown };
}
