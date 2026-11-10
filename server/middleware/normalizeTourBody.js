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
  if (typeof out.startDates === "string") {
    out.startDates = out.startDates
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((d) => new Date(`${d}T00:00:00.000Z`))
      .filter((d) => !Number.isNaN(d.getTime()))
      .map((d) => d.toISOString());
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
