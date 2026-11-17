/* Accepts "2027-01-23" (date only) or a full ISO string. */
const parseDateInput = (value) => {
  const v = String(value).trim();

  if (!v) return null;

  const date = /^\d{4}-\d{2}-\d{2}$/.test(v)
    ? new Date(`${v}T00:00:00.000Z`)
    : new Date(v);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const normalizeTourBody = (req, _res, next) => {
  if (!req.is("multipart/form-data")) return next();

  const out = { ...(req.body || {}) };

  const asNum = (v) => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = Number(v);

    return Number.isFinite(n) ? n : undefined;
  };

  /* ---------- numbers ---------- */
  for (const key of ["duration", "maxGroupSize", "price"]) {
    if (key in out) {
      const n = asNum(out[key]);

      if (n === undefined) delete out[key];
      else out[key] = n;
    }
  }

  /* empty discount => clear it */
  if ("priceDiscount" in out) {
    const n = asNum(out.priceDiscount);

    out.priceDiscount = n === undefined ? null : n;
  }

  /* ---------- booleans ---------- */
  if ("featured" in out) {
    out.featured = out.featured === true || out.featured === "true";
  }

  /* ---------- startDates ---------- */
  if ("startDates" in out) {
    const rawDates = Array.isArray(out.startDates)
      ? out.startDates
      : String(out.startDates ?? "").split(/[,\n]/);

    out.startDates = [
      ...new Set(
        rawDates
          .map(parseDateInput)
          .filter(Boolean)
          .map((d) => d.toISOString()),
      ),
    ];
  }

  /* ---------- location ---------- */
  if (
    ["lat", "lng", "address", "city", "country"].some(
      (k) => out[k] !== undefined,
    )
  ) {
    const lat = asNum(out.lat);
    const lng = asNum(out.lng);

    if (
      lat !== undefined &&
      lng !== undefined &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      out.location = {
        ...(typeof out.location === "object" && out.location
          ? out.location
          : {}),
        type: "Point",
        coordinates: [lng, lat],
        ...(out.address !== undefined && {
          address: String(out.address).trim(),
        }),
        ...(out.city !== undefined && { city: String(out.city).trim() }),
        ...(out.country !== undefined && {
          country: String(out.country).trim(),
        }),
      };
    }

    ["lat", "lng", "address", "city", "country"].forEach((k) => delete out[k]);
  }

  /* ---------- uploaded file → imageCover path ---------- */
  if (req.file) out.imageCover = `/img/tours/${req.file.filename}`;

  delete out.imageCoverFile;

  req.body = out;
  next();
};
