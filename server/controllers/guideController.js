import mongoose from "mongoose";
import User from "../models/User.js";
import Tour from "../models/Tour.js";
import Booking from "../models/Booking.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/* Matches Date#getUTCDay(): 0 = Sunday */
const WEEKDAY_BY_INDEX = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const rosterFilter = (now = new Date()) => ({
  $or: [
    { status: "confirmed" },
    { status: "completed", startDate: { $lt: now } },
  ],
});

const isLeadOrAdmin = (role) => role === "lead-guide" || role === "admin";

/* Only the fields the guide workspace needs from the current user */
const loadMe = (id) =>
  User.findById(id)
    .select(
      "assignedTours availability rating totalReviews performanceMetrics role",
    )
    .lean();

/* Tour.guides and User.assignedTours can drift, so accept either link */
const assignedTourFilter = (me) => ({
  isActive: true,
  $or: [{ guides: me._id }, { _id: { $in: me.assignedTours || [] } }],
});

const canAccessTour = async (me, tourId) => {
  if (isLeadOrAdmin(me.role)) return true;

  const hit = await Tour.exists({ _id: tourId, ...assignedTourFilter(me) });

  return Boolean(hit);
};

/* ============================================================
   GET /guide/dashboard
   ============================================================ */

export const getGuideDashboard = catchAsync(async (req, res, next) => {
  const me = await loadMe(req.user._id);

  if (!me) return next(new AppError("User not found", 404));

  const now = new Date();

  const tours = await Tour.find(assignedTourFilter(me))
    .select("name slug imageCover startDates")
    .lean();

  const tourIds = tours.map((t) => t._id);

  const grouped = tourIds.length
    ? await Booking.aggregate([
        {
          $match: {
            tour: { $in: tourIds },
            status: "confirmed",
            startDate: { $gte: now },
          },
        },
        {
          $group: {
            _id: { tour: "$tour", startDate: "$startDate" },
            guests: { $sum: "$guests" },
            bookings: { $sum: 1 },
          },
        },
      ])
    : [];

  const key = (tourId, date) => `${tourId}_${new Date(date).toISOString()}`;

  const byDeparture = new Map(
    grouped.map((g) => [key(g._id.tour, g._id.startDate), g]),
  );

  const departures = [];
  const tourSummaries = tours.map((t) => {
    const upcoming = (t.startDates || [])
      .map((d) => new Date(d))
      .filter((d) => d >= now)
      .sort((a, b) => a - b);

    let upcomingGuests = 0;

    upcoming.forEach((d) => {
      const hit = byDeparture.get(key(t._id, d));
      const guests = hit?.guests ?? 0;

      upcomingGuests += guests;
      departures.push({
        tourId: t._id,
        tourName: t.name,
        slug: t.slug,
        startDate: d,
        guests,
        bookings: hit?.bookings ?? 0,
      });
    });

    return {
      _id: t._id,
      name: t.name,
      slug: t.slug,
      imageCover: t.imageCover,
      nextDeparture: upcoming[0] ?? null,
      upcomingGuests,
    };
  });

  departures.sort((a, b) => a.startDate - b.startDate);

  /* Upcoming departures per weekday (all of them, not just the 8 shown) */
  const departureDays = Object.fromEntries(DAYS.map((d) => [d, 0]));

  departures.forEach((dep) => {
    departureDays[WEEKDAY_BY_INDEX[new Date(dep.startDate).getUTCDay()]] += 1;
  });

  res.status(200).json({
    status: "success",
    data: {
      stats: {
        assignedTours: tours.length,
        upcomingDepartures: departures.length,
        upcomingGuests: departures.reduce((s, d) => s + d.guests, 0),
        rating: me.rating ?? 0,
        totalReviews: me.totalReviews ?? 0,
      },
      departures: departures.slice(0, 8),
      tours: tourSummaries,
      availability: me.availability ?? {},
      departureDays,
    },
  });
});

/* ============================================================
   GET /guide/tours/:id/roster
   ============================================================ */

export const getTourRoster = catchAsync(async (req, res, next) => {
  const me = await loadMe(req.user._id);

  if (!me) return next(new AppError("User not found", 404));

  const tour = await Tour.findOne({ _id: req.params.id, isActive: true })
    .select(
      "name slug imageCover startDates duration maxGroupSize difficulty startLocation guides",
    )
    .populate({ path: "guides", select: "name photo role" })
    .lean();

  if (!tour) return next(new AppError("Tour not found", 404));

  if (!(await canAccessTour(me, tour._id))) {
    return next(new AppError("You are not assigned to this tour", 403));
  }

  const now = new Date();

  /* No email, price or payment data: guides only need to run the trip */
  const bookings = await Booking.find({
    tour: tour._id,
    ...rosterFilter(now),
  })
    .sort("startDate")
    .select("startDate guests status bookingReference user")
    .populate({ path: "user", select: "name photo phoneNumber" })
    .lean();

  const upcoming = bookings.filter((b) => new Date(b.startDate) >= now);
  const upcomingDates = new Set(
    upcoming.map((b) => new Date(b.startDate).toISOString()),
  );

  const nextDeparture =
    (tour.startDates || [])
      .map((d) => new Date(d))
      .filter((d) => d >= now)
      .sort((a, b) => a - b)[0] ?? null;

  const stats = {
    totalBookings: bookings.length,
    totalGuests: bookings.reduce((s, b) => s + (b.guests || 0), 0),
    upcomingBookings: upcoming.length,
    upcomingGuests: upcoming.reduce((s, b) => s + (b.guests || 0), 0),
    upcomingDepartures: upcomingDates.size,
    completedBookings: bookings.filter((b) => b.status === "completed").length,
    nextDeparture,
  };

  res.status(200).json({
    status: "success",
    data: { tour, bookings, stats },
  });
});

/* ============================================================
   PATCH /guide/availability
   ============================================================ */

export const updateMyAvailability = catchAsync(async (req, res, next) => {
  const clean = {};

  DAYS.forEach((day) => {
    if (typeof req.body[day] === "boolean") clean[day] = req.body[day];
  });

  if (Object.keys(clean).length === 0) {
    return next(
      new AppError(
        `Send at least one of: ${DAYS.join(", ")} (true/false)`,
        400,
      ),
    );
  }

  const set = {};

  Object.entries(clean).forEach(([day, value]) => {
    set[`availability.${day}`] = value;
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: set },
    { new: true, runValidators: true },
  ).select("availability");

  if (!user) return next(new AppError("User not found", 404));

  res.status(200).json({
    status: "success",
    data: { availability: user.availability },
  });
});

/* ============================================================
   LEAD GUIDE: GET /guide/team
   ============================================================ */

export const getTeam = catchAsync(async (_req, res) => {
  const [guides, tours] = await Promise.all([
    User.find({ role: { $in: ["guide", "lead-guide"] } })
      .select("name email photo role")
      .sort("name")
      .lean(),
    Tour.find({ isActive: true })
      .select("name slug guides")
      .sort("name")
      .lean(),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      guides,
      tours: tours.map((t) => ({
        _id: t._id,
        name: t.name,
        slug: t.slug,
        guides: (t.guides || []).map(String),
      })),
    },
  });
});

/* ============================================================
   LEAD GUIDE: PATCH /guide/tours/:id/guides
   body: { guideId, action: "assign" | "unassign" }
   ============================================================ */

export const setTourGuide = catchAsync(async (req, res, next) => {
  const { guideId, action } = req.body;

  if (!mongoose.Types.ObjectId.isValid(guideId)) {
    return next(new AppError("Please provide a valid guideId", 400));
  }

  if (!["assign", "unassign"].includes(action)) {
    return next(new AppError('action must be "assign" or "unassign"', 400));
  }

  const [tour, guide] = await Promise.all([
    Tour.findOne({ _id: req.params.id, isActive: true }).select("_id"),
    User.findOne({
      _id: guideId,
      role: { $in: ["guide", "lead-guide"] },
    }).select("_id"),
  ]);

  if (!tour) return next(new AppError("Tour not found", 404));
  if (!guide) return next(new AppError("Guide not found", 404));

  const add = action === "assign";

  /* Keep both sides of the relationship in sync */
  await Promise.all([
    Tour.updateOne(
      { _id: tour._id },
      add
        ? { $addToSet: { guides: guide._id } }
        : { $pull: { guides: guide._id } },
    ),
    User.updateOne(
      { _id: guide._id },
      add
        ? { $addToSet: { assignedTours: tour._id } }
        : { $pull: { assignedTours: tour._id } },
    ),
  ]);

  res.status(200).json({
    status: "success",
    message: add ? "Guide assigned" : "Guide removed from tour",
  });
});
