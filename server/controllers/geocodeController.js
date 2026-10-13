import { URL } from "node:url";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

/**
 * In-memory cache. Fine for a single instance; swap for Redis in prod.
 * Nominatim asks for ≤1 req/s, so caching matters.
 */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);

  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);

    return null;
  }

  return hit.value;
}

function cacheSet(key, value) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });

  if (cache.size > 500) {
    const oldest = cache.keys().next().value;

    cache.delete(oldest);
  }
}

export const geocodePlace = catchAsync(async (req, res) => {
  const q = (req.query.q || "").toString().trim();

  if (!q || q.length < 2) {
    throw new AppError("Please provide a place name (min 2 characters)", 400);
  }
  if (q.length > 200) {
    throw new AppError("Place name is too long", 400);
  }

  const cacheKey = q.toLowerCase();
  const cached = cacheGet(cacheKey);

  if (cached) {
    return res.status(200).json({ status: "success", data: cached });
  }

  const url = new URL(NOMINATIM);

  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let response;

  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": "ZuriTours/1.0 (contact@zuritours.example)",
        "Accept-Language": req.headers["accept-language"] || "en",
      },
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new AppError("Geocoding service timed out", 504);
    }
    throw new AppError("Could not reach geocoding service", 502);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new AppError("Geocoding service unavailable", 502);
  }

  const results = await response.json();

  if (!Array.isArray(results) || results.length === 0) {
    throw new AppError(`No location found for "${q}"`, 404);
  }

  const hit = results[0];

  const payload = {
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    label: hit.display_name,
    type: hit.type,
    bbox: hit.boundingbox?.map(Number) ?? null,
  };

  cacheSet(cacheKey, payload);

  res.status(200).json({ status: "success", data: payload });
});
