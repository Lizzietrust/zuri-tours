import User from "../models/User.js";
import Tour from "../models/Tour.js";
import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import { catchAsync } from "../utils/catchAsync.js";

export const getDashboardStats = catchAsync(async (req, res) => {
  const [
    users,
    activeTours,
    trashedTours,
    approvedReviews,
    removedReviews,
    reportedReviews,
    bookingsByStatus,
    revenue,
    recentBookings,
  ] = await Promise.all([
    User.countDocuments({ accountDeleted: { $ne: true } }),
    Tour.countDocuments({ isActive: true }),
    Tour.countDocuments({ isActive: false }),
    Review.countDocuments({ status: "approved" }),
    Review.countDocuments({ status: "removed" }),
    Review.countDocuments({
      "flagReasons.0": { $exists: true },
      status: "approved",
    }),
    Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]),
    Booking.find()
      .sort("-createdAt")
      .limit(5)
      .populate({ path: "tour", select: "name" })
      .populate({ path: "user", select: "name email" })
      .lean(),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      users,
      tours: { active: activeTours, trashed: trashedTours },
      reviews: {
        approved: approvedReviews,
        removed: removedReviews,
        reported: reportedReviews,
      },
      bookings: {
        byStatus: Object.fromEntries(
          bookingsByStatus.map((b) => [b._id, b.count]),
        ),
        total: bookingsByStatus.reduce((s, b) => s + b.count, 0),
        revenue: revenue[0]?.total ?? 0,
      },
      recentBookings,
    },
  });
});
