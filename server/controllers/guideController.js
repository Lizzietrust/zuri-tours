import User from "../models/User.js";
import Tour from "../models/Tour.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";

export const getGuides = catchAsync(async (req, res) => {
  const guides = await User.find({
    role: { $in: ["guide", "lead-guide"] },
    isActive: true,
    accountDeleted: false,
  })
    .select(
      "name email photo bio experienceYears specialties languages rating totalReviews",
    )
    .populate({
      path: "assignedTours",
      select: "name slug duration difficulty",
    });

  res.status(200).json({
    status: "success",
    count: guides.length,
    data: { guides },
  });
});

export const getGuide = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = id || req.user._id;

  const guide = await User.findOne({
    _id: userId,
    role: { $in: ["guide", "lead-guide"] },
    isActive: true,
    accountDeleted: false,
  })
    .select(
      "name email photo bio experienceYears specialties languages rating totalReviews certifications phoneNumber emergencyContact availability",
    )
    .populate({
      path: "assignedTours",
      select: "name slug price duration difficulty ratingsAverage startDates",
    });

  if (!guide) {
    throw new AppError("Guide not found", 404);
  }

  const toursWithReviews = await Tour.find({
    guides: guide._id,
  }).select("reviews ratingsAverage");

  const totalReviews = toursWithReviews.reduce(
    (sum, tour) => sum + (tour.reviews ? tour.reviews.length : 0),
    0,
  );

  const avgRating =
    toursWithReviews.length > 0
      ? toursWithReviews.reduce((sum, tour) => sum + tour.ratingsAverage, 0) /
        toursWithReviews.length
      : 0;

  const guideData = guide.toObject();

  guideData.totalReviews = totalReviews;
  guideData.averageRating = Math.round(avgRating * 10) / 10;

  res.status(200).json({
    status: "success",
    data: { guide: guideData },
  });
});

export const updateGuideProfile = catchAsync(async (req, res) => {
  const allowedFields = [
    "name",
    "photo",
    "bio",
    "experienceYears",
    "specialties",
    "languages",
    "phoneNumber",
    "availability",
    "emergencyContact",
  ];

  const updateData = {};

  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updateData[key] = req.body[key];
    }
  });

  const guide = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true,
  }).select("name email photo bio experienceYears specialties languages");

  res.status(200).json({
    status: "success",
    data: { guide },
  });
});

export const getGuideStatistics = catchAsync(async (req, res) => {
  const guideId = req.user._id;

  const tours = await Tour.find({
    guides: guideId,
    isActive: true,
  });

  const totalTours = tours.length;
  const upcomingTours = tours.filter((tour) => {
    const now = new Date();

    return tour.startDates && tour.startDates.some((date) => date >= now);
  });

  const completedTours = tours.filter((tour) => {
    const now = new Date();

    return tour.startDates && tour.startDates.every((date) => date < now);
  });

  const totalRevenue = tours.reduce((sum, tour) => sum + (tour.price || 0), 0);

  res.status(200).json({
    status: "success",
    data: {
      totalTours,
      upcomingTours: upcomingTours.length,
      completedTours: completedTours.length,
      totalRevenue,
      averageRating: req.user.rating || 0,
      totalReviews: req.user.totalReviews || 0,
    },
  });
});

export const getGuidePerformance = catchAsync(async (req, res) => {
  const guideId = req.user._id;

  const tours = await Tour.find({
    guides: guideId,
    isActive: true,
  });

  const totalTours = tours.length;
  const totalRevenue = tours.reduce((sum, tour) => sum + (tour.price || 0), 0);

  const avgDuration =
    totalTours > 0
      ? tours.reduce((sum, tour) => sum + (tour.duration || 0), 0) / totalTours
      : 0;

  const satisfactionRating =
    req.user.performanceMetrics?.customerSatisfaction || 0;
  const completionRate = req.user.performanceMetrics?.completionRate || 0;

  res.status(200).json({
    status: "success",
    data: {
      totalToursLed: totalTours,
      totalRevenue,
      averageTourDuration: Math.round(avgDuration),
      customerSatisfaction: satisfactionRating,
      completionRate,
      rating: req.user.rating || 0,
      totalReviews: req.user.totalReviews || 0,
    },
  });
});

export const getAllGuidesAdmin = catchAsync(async (req, res) => {
  const guides = await User.find({
    role: { $in: ["guide", "lead-guide"] },
    accountDeleted: false,
  })
    .select(
      "name email role photo isActive experienceYears specialties rating totalReviews",
    )
    .populate({
      path: "assignedTours",
      select: "name slug",
    });

  res.status(200).json({
    status: "success",
    count: guides.length,
    data: { guides },
  });
});

export const updateGuideStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    throw new AppError("Please provide isActive status", 400);
  }

  const guide = await User.findOneAndUpdate(
    {
      _id: id,
      role: { $in: ["guide", "lead-guide"] },
    },
    { isActive },
    {
      new: true,
      runValidators: true,
    },
  ).select("name email role isActive");

  if (!guide) {
    throw new AppError("Guide not found", 404);
  }

  res.status(200).json({
    status: "success",
    message: `Guide ${isActive ? "activated" : "deactivated"} successfully`,
    data: { guide },
  });
});

export const assignTourToGuide = catchAsync(async (req, res) => {
  const { id: guideId, tourId } = req.params;

  const guide = await User.findOne({
    _id: guideId,
    role: { $in: ["guide", "lead-guide"] },
  });

  if (!guide) {
    throw new AppError("Guide not found", 404);
  }

  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  if (!guide.assignedTours.includes(tourId)) {
    guide.assignedTours.push(tourId);
    await guide.save();
  }

  if (!tour.guides.includes(guideId)) {
    tour.guides.push(guideId);
    await tour.save();
  }

  res.status(200).json({
    status: "success",
    message: "Tour assigned to guide successfully",
  });
});

export const removeTourFromGuide = catchAsync(async (req, res) => {
  const { id: guideId, tourId } = req.params;

  const guide = await User.findById(guideId);

  if (!guide) {
    throw new AppError("Guide not found", 404);
  }

  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  guide.assignedTours = guide.assignedTours.filter(
    (id) => id.toString() !== tourId,
  );
  await guide.save();

  tour.guides = tour.guides.filter((id) => id.toString() !== guideId);
  await tour.save();

  res.status(200).json({
    status: "success",
    message: "Tour removed from guide successfully",
  });
});
