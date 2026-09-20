import Tour from "../models/Tour.js";
import { AppError } from "../utils/appError.js";

/* ============================================================
   UNIT CONVERSION
   ============================================================ */

/**
 * Earth's radius in each supported unit (approximate, good enough
 * for "within X km" queries).
 */
const EARTH_RADIUS = {
  m: 6371008.8,
  km: 6371.0088,
  mi: 3958.7613,
  nm: 3440.065,
};

/**
 * Convert a distance value + unit into meters, which is what
 * MongoDB's `$near`/`$geoWithin` expect.
 */
export const convertToMeters = (distance, unit) => {
  const distanceNum = Number(distance);

  if (!Number.isFinite(distanceNum) || distanceNum <= 0) {
    throw new AppError("Distance must be a positive number", 400);
  }

  switch (unit) {
    case "km":
      return distanceNum * 1000;
    case "mi":
      return distanceNum * 1609.34;
    case "nm":
      return distanceNum * 1852;
    case "m":
      return distanceNum;
    default:
      throw new AppError("Invalid unit. Use one of: m, km, mi, nm", 400);
  }
};

/**
 * Convert meters back to the caller's preferred unit. Used for
 * returning `distance` alongside each result.
 */
export const convertFromMeters = (meters, unit) => {
  switch (unit) {
    case "km":
      return meters / 1000;
    case "mi":
      return meters / 1609.34;
    case "nm":
      return meters / 1852;
    case "m":
    default:
      return meters;
  }
};

/* ============================================================
   COORDINATE PARSING / VALIDATION
   ============================================================ */

export const parseLatLng = (latlng) => {
  if (typeof latlng !== "string") {
    throw new AppError("Coordinates must be in 'lat,lng' format", 400);
  }

  const parts = latlng.split(",").map((p) => Number(p.trim()));

  if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n))) {
    throw new AppError("Coordinates must be in 'lat,lng' format", 400);
  }

  const [a, b] = parts;

  if (a >= -90 && a <= 90 && b >= -180 && b <= 180) {
    return { lng: b, lat: a };
  }

  if (a >= -180 && a <= 180 && b >= -90 && b <= 90) {
    return { lng: a, lat: b };
  }

  throw new AppError(
    "Invalid coordinates: latitude must be -90..90, longitude -180..180",
    400,
  );
};

/* ============================================================
   HAVERSINE DISTANCE (in meters)
   ============================================================ */

/**
 * Compute the great-circle distance between two points, in meters.
 * Used for enriching each result with `distanceInKm` etc.
 *
 * Accepts `[lng, lat]` arrays (Mongo order).
 */
export const haversineMeters = ([lng1, lat1], [lng2, lat2]) => {
  const R = EARTH_RADIUS.m;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/* ============================================================
   TOUR GEO QUERIES
   ============================================================ */

/**
 * Find all active, non-secret tours within `radiusMeters` of
 * `[lng, lat]`, sorted by distance ascending, with `distance`
 * fields added to each result.
 *
 * Uses the `2dsphere` index on `location.coordinates`.
 *
 * @param {Object} params
 * @param {number} params.lng
 * @param {number} params.lat
 * @param {number} params.radiusMeters
 * @param {string} params.unit        - one of m, km, mi, nm
 * @param {number} [params.limit=100] - cap on results
 * @param {number} [params.page=1]
 * @param {Object} [params.filter={}] - extra filter (e.g. difficulty)
 * @returns {Promise<{ tours: Object[], total: number, center: [number, number] }>}
 */
export const findToursWithinRadius = async ({
  lng,
  lat,
  radiusMeters,
  unit = "km",
  limit = 100,
  page = 1,
  filter = {},
}) => {
  const skip = (page - 1) * limit;

  const tours = await Tour.find({
    ...filter,
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        $maxDistance: radiusMeters,
      },
    },
  })
    .skip(skip)
    .limit(limit)
    .lean();

  const enriched = tours.map((tour) => {
    const coords = tour.location?.coordinates;

    if (!coords || coords.length !== 2) {
      return { ...tour, distance: null, distanceUnit: unit };
    }

    const meters = haversineMeters(coords, [lng, lat]);

    return {
      ...tour,
      distance: Number(convertFromMeters(meters, unit).toFixed(2)),
      distanceUnit: unit,
      distanceInMeters: Math.round(meters),
    };
  });

  const total = await Tour.countDocuments({
    ...filter,
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: radiusMeters,
      },
    },
  });

  return {
    tours: enriched,
    total,
    center: [lng, lat],
    radius: { value: convertFromMeters(radiusMeters, unit), unit },
  };
};

/**
 * Compute the distance from a single tour (looked up by id or slug)
 * to a given point. Returns null if the tour has no coordinates.
 */
export const distanceFromTourToPoint = async (tourIdOrSlug, lng, lat, unit) => {
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(tourIdOrSlug);

  const query = isMongoId
    ? Tour.findById(tourIdOrSlug).select("name slug location")
    : Tour.findOne({ slug: tourIdOrSlug }).select("name slug location");

  const tour = await query.lean();

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  const coords = tour.location?.coordinates;

  if (!coords || coords.length !== 2) {
    throw new AppError("This tour has no location coordinates", 400);
  }

  const meters = haversineMeters(coords, [lng, lat]);

  return {
    tour: { _id: tour._id, name: tour.name, slug: tour.slug },
    from: coords,
    to: [lng, lat],
    distance: Number(convertFromMeters(meters, unit).toFixed(2)),
    distanceUnit: unit,
    distanceInMeters: Math.round(meters),
  };
};

export default {
  convertToMeters,
  convertFromMeters,
  parseLatLng,
  haversineMeters,
  findToursWithinRadius,
  distanceFromTourToPoint,
};
