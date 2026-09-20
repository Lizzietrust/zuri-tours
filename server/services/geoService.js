import Tour from "../models/Tour.js";
import { AppError } from "../utils/appError.js";

/* ============================================================
   UNIT CONVERSION
   ============================================================ */

const EARTH_RADIUS = {
  m: 6371008.8,
  km: 6371.0088,
  mi: 3958.7613,
  nm: 3440.065,
};

/**
 * Meters per unit — single source of truth used everywhere we need
 * to convert distances inside aggregation pipelines.
 */
const METERS_PER_UNIT = {
  m: 1,
  km: 1000,
  mi: 1609.34,
  nm: 1852,
};

/**
 * Return the number of meters in one `unit`. Falls back to `1` (m)
 * for unrecognized units so aggregations never blow up.
 */
const metersPerUnit = (unit) => METERS_PER_UNIT[unit] ?? 1;

export const convertToMeters = (distance, unit) => {
  const distanceNum = Number(distance);

  if (!Number.isFinite(distanceNum) || distanceNum <= 0) {
    throw new AppError("Distance must be a positive number", 400);
  }

  if (!METERS_PER_UNIT[unit]) {
    throw new AppError("Invalid unit. Use one of: m, km, mi, nm", 400);
  }

  return distanceNum * METERS_PER_UNIT[unit];
};

export const convertFromMeters = (meters, unit) => meters / metersPerUnit(unit);

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
   TOUR GEO QUERIES (existing — kept for backward compatibility)
   ============================================================ */

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
        $geometry: { type: "Point", coordinates: [lng, lat] },
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

/* ==================================================================
   GEOSPATIAL AGGREGATION — $geoNear PIPELINE BUILDERS
   ================================================================== */

/**
 * Build the standard `$geoNear` stage.
 */
const buildGeoNearStage = ({
  lng,
  lat,
  radiusMeters,
  distanceField = "distanceMeters",
  query = {},
  spherical = true,
  minDistance = 0,
}) => ({
  $geoNear: {
    near: { type: "Point", coordinates: [lng, lat] },
    distanceField,
    maxDistance: radiusMeters,
    minDistance,
    spherical,
    key: "location.coordinates",
    query,
  },
});

/**
 * Build the `$sort` stage for a geo aggregation based on `sortBy`.
 * Distance is always the tiebreaker so results are stable.
 */
const buildGeoSortStage = (sortBy = "distance") => {
  switch (sortBy) {
    case "price":
      return { $sort: { price: 1, distanceMeters: 1 } };
    case "ratingsAverage":
      return { $sort: { ratingsAverage: -1, distanceMeters: 1 } };
    case "distance":
    default:
      return { $sort: { distanceMeters: 1 } };
  }
};

export const aggregateToursWithinRadius = async ({
  lng,
  lat,
  radiusMeters,
  unit = "km",
  page = 1,
  limit = 20,
  filter = {},
  sortBy = "distance",
}) => {
  const skip = (page - 1) * limit;
  const mpu = metersPerUnit(unit);

  const { location: _dropLocation, ...safeFilter } = filter;

  const pipeline = [
    buildGeoNearStage({
      lng,
      lat,
      radiusMeters,
      distanceField: "distanceMeters",
      query: {
        isActive: true,
        isSecret: false,
        ...safeFilter,
      },
    }),

    {
      $addFields: {
        distance: {
          $round: [{ $divide: ["$distanceMeters", mpu] }, 2],
        },
        distanceUnit: unit,
        distanceInMeters: { $round: ["$distanceMeters", 0] },
      },
    },

    buildGeoSortStage(sortBy),

    {
      $facet: {
        tours: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              name: 1,
              slug: 1,
              summary: 1,
              price: 1,
              priceDiscount: 1,
              duration: 1,
              difficulty: 1,
              maxGroupSize: 1,
              ratingsAverage: 1,
              ratingsQuantity: 1,
              imageCover: 1,
              images: 1,
              startDates: 1,
              category: 1,
              location: 1,
              distance: 1,
              distanceUnit: 1,
              distanceInMeters: 1,
            },
          },
        ],
        total: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await Tour.aggregate(pipeline);

  const total = result?.total?.[0]?.count || 0;

  return {
    tours: result?.tours || [],
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
    center: [lng, lat],
    radius: { value: convertFromMeters(radiusMeters, unit), unit },
  };
};

/**
 * Aggregate distance STATISTICS for tours around a point.
 * Returns min / max / avg distance + count, optionally grouped by
 * difficulty, category, or featured flag.
 */
export const aggregateDistanceStats = async ({
  lng,
  lat,
  radiusMeters = 500000,
  unit = "km",
  groupBy = null,
}) => {
  const mpu = metersPerUnit(unit);

  const groupStage = groupBy
    ? {
        $group: {
          _id: `$${groupBy}`,
          count: { $sum: 1 },
          minDistance: { $min: "$distance" },
          maxDistance: { $max: "$distance" },
          avgDistance: { $avg: "$distance" },
          minPrice: { $min: "$price" },
          avgPrice: { $avg: "$price" },
          avgRating: { $avg: "$ratingsAverage" },
        },
      }
    : {
        $group: {
          _id: null,
          count: { $sum: 1 },
          minDistance: { $min: "$distance" },
          maxDistance: { $max: "$distance" },
          avgDistance: { $avg: "$distance" },
          minPrice: { $min: "$price" },
          avgPrice: { $avg: "$price" },
          avgRating: { $avg: "$ratingsAverage" },
        },
      };

  const pipeline = [
    buildGeoNearStage({
      lng,
      lat,
      radiusMeters,
      distanceField: "distanceMeters",
      query: { isActive: true, isSecret: false },
    }),

    {
      $addFields: {
        distance: { $divide: ["$distanceMeters", mpu] },
      },
    },

    groupStage,

    {
      $project: {
        _id: 0,
        ...(groupBy && { [groupBy]: "$_id" }),
        count: 1,
        minDistance: { $round: ["$minDistance", 2] },
        maxDistance: { $round: ["$maxDistance", 2] },
        avgDistance: { $round: ["$avgDistance", 2] },
        minPrice: { $round: ["$minPrice", 2] },
        avgPrice: { $round: ["$avgPrice", 2] },
        avgRating: { $round: ["$avgRating", 2] },
        distanceUnit: { $literal: unit },
      },
    },

    { $sort: groupBy ? { avgDistance: 1 } : { count: -1 } },
  ];

  const results = await Tour.aggregate(pipeline);

  if (!groupBy) {
    return {
      center: [lng, lat],
      radius: { value: convertFromMeters(radiusMeters, unit), unit },
      stats: results[0] || {
        count: 0,
        minDistance: null,
        maxDistance: null,
        avgDistance: null,
        minPrice: null,
        avgPrice: null,
        avgRating: null,
      },
    };
  }

  return {
    center: [lng, lat],
    radius: { value: convertFromMeters(radiusMeters, unit), unit },
    groupedBy: groupBy,
    groups: results,
  };
};

export const aggregateDistanceDistribution = async ({
  lng,
  lat,
  radiusMeters = 500000,
  unit = "km",
  buckets = 5,
}) => {
  const mpu = metersPerUnit(unit);

  const radiusInUnit = convertFromMeters(radiusMeters, unit);
  const step = radiusInUnit / buckets;

  const boundaries = Array.from(
    { length: buckets + 1 },
    (_, i) => Math.round(step * i * 100) / 100,
  );

  const pipeline = [
    buildGeoNearStage({
      lng,
      lat,
      radiusMeters,
      distanceField: "distanceMeters",
      query: { isActive: true, isSecret: false },
    }),

    {
      $addFields: {
        distance: { $divide: ["$distanceMeters", mpu] },
      },
    },

    {
      $bucket: {
        groupBy: "$distance",
        boundaries,
        default: `over_${radiusInUnit}`,
        output: {
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          avgRating: { $avg: "$ratingsAverage" },
          sampleTourNames: { $push: "$name" },
        },
      },
    },

    {
      $project: {
        _id: 0,
        rangeStart: "$_id",
        count: 1,
        avgPrice: { $round: ["$avgPrice", 2] },
        avgRating: { $round: ["$avgRating", 2] },
        sampleTourNames: { $slice: ["$sampleTourNames", 3] },
      },
    },

    { $sort: { rangeStart: 1 } },
  ];

  const distribution = await Tour.aggregate(pipeline);

  const totalTours = distribution.reduce((sum, b) => sum + b.count, 0);

  return {
    center: [lng, lat],
    radius: { value: radiusInUnit, unit },
    buckets,
    bucketWidth: Math.round(step * 100) / 100,
    totalTours,
    distribution,
  };
};

export const aggregateDistancesToTours = async ({
  lng,
  lat,
  tourIds,
  unit = "km",
  radiusMeters = 20000000,
}) => {
  if (!Array.isArray(tourIds) || tourIds.length === 0) {
    return { center: [lng, lat], unit, tours: [] };
  }

  const mongoose = (await import("mongoose")).default;
  const objectIds = tourIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (objectIds.length === 0) {
    return { center: [lng, lat], unit, tours: [] };
  }

  const mpu = metersPerUnit(unit);

  const pipeline = [
    buildGeoNearStage({
      lng,
      lat,
      radiusMeters,
      distanceField: "distanceMeters",
      query: {
        isActive: true,
        isSecret: false,
        _id: { $in: objectIds },
      },
    }),

    {
      $addFields: {
        distance: {
          $round: [{ $divide: ["$distanceMeters", mpu] }, 2],
        },
        distanceUnit: unit,
        distanceInMeters: { $round: ["$distanceMeters", 0] },
      },
    },

    {
      $project: {
        name: 1,
        slug: 1,
        price: 1,
        ratingsAverage: 1,
        imageCover: 1,
        location: 1,
        distance: 1,
        distanceUnit: 1,
        distanceInMeters: 1,
      },
    },

    { $sort: { distanceMeters: 1 } },
  ];

  const tours = await Tour.aggregate(pipeline);

  return {
    center: [lng, lat],
    unit,
    count: tours.length,
    tours,
  };
};

export default {
  convertToMeters,
  convertFromMeters,
  parseLatLng,
  haversineMeters,
  findToursWithinRadius,
  distanceFromTourToPoint,
  // aggregation helpers
  aggregateToursWithinRadius,
  aggregateDistanceStats,
  aggregateDistanceDistribution,
  aggregateDistancesToTours,
};
