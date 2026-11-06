import { AppError } from "../utils/appError.js";

/**
 * When the request is multipart/form-data (because a cover image was uploaded),
 * every field arrives as a string. This rebuilds the JSON shape the rest of
 * the stack expects. For plain JSON requests it's a no-op.
 */
export const normalizeTourBody = (req, _res, next) => {
  if (!req.is("multipart/form-data")) return next();

  const body = req.body || {};
  const out = { ...body };

  /* ---------- numbers ---------- */
  const asNum = (v) => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = Number(v);

    return Number.isFinite(n) ? n : undefined;
  };

  for (const key of ["duration", "maxGroupSize", "price", "priceDiscount"]) {
    if (key in out) {
      const n = asNum(out[key]);

      if (n === undefined) delete out[key];
      else out[key] = n;
    }
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
    out.lat !== undefined ||
    out.lng !== undefined ||
    out.address !== undefined ||
    out.city !== undefined ||
    out.country !== undefined
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

    delete out.lat;
    delete out.lng;
    delete out.address;
    delete out.city;
    delete out.country;
  }

  /* ---------- uploaded file → imageCover path ---------- */
  if (req.file) {
    out.imageCover = `/img/tours/${req.file.filename}`;
  }

  /* ---------- strip multer's own bookkeeping ---------- */
  delete out.imageCoverFile;

  if (Object.prototype.hasOwnProperty.call(out, "imageCover") && !req.file) {
    // keep whatever the client typed (URL or filename)
  }

  req.body = out;
  next();
};

/* Kept exported for symmetry / future reuse if you ever need it */
export { AppError };
