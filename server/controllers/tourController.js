import Tour from "../models/Tour.js";
import User from "../models/User.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";
import TourQueryService from "../services/tourQueryService.js";

export const getAllTours = catchAsync(async (req, res) => {
  const { tours, pagination, count } =
    await TourQueryService.executePaginatedQuery(req.query);

  res.status(200).json({
    status: "success",
    results: count,
    pagination,
    data: { tours },
  });
});

export const getTour = catchAsync(async (req, res) => {
  const { id } = req.params;
  const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);

  const tour = isMongoId
    ? await TourQueryService.getTourById(id)
    : await TourQueryService.getTourBySlug(id);

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  if (req.user && req.user.role === "guide") {
    const user = await User.findById(req.user._id);
    const hasAccess = user.assignedTours.some(
      (tourId) => tourId.toString() === tour._id.toString(),
    );

    if (
      !hasAccess &&
      req.user.role !== "lead-guide" &&
      req.user.role !== "admin"
    ) {
      throw new AppError("You don't have access to this tour", 403);
    }
  }

  res.status(200).json({
    status: "success",
    data: { tour },
  });
});

export const createTour = catchAsync(async (req, res) => {
  const tourData = {
    ...req.body,
    createdBy: req.user._id,
  };

  if (req.user.role === "lead-guide") {
    tourData.guides = tourData.guides || [];
    if (!tourData.guides.includes(req.user._id)) {
      tourData.guides.push(req.user._id);
    }
  }

  const tour = await Tour.create(tourData);

  if (req.user.role === "lead-guide") {
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { assignedTours: tour._id },
    });
  }

  res.status(201).json({
    status: "success",
    data: { tour },
  });
});

export const updateTour = catchAsync(async (req, res) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  res.status(200).json({
    status: "success",
    data: { tour },
  });
});

export const deleteTour = catchAsync(async (req, res) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  await User.updateMany(
    { assignedTours: tour._id },
    { $pull: { assignedTours: tour._id } },
  );

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const getToursByPriceRange = catchAsync(async (req, res) => {
  const minPrice = parseInt(req.query.min, 10) || 0;
  const maxPrice = parseInt(req.query.max, 10) || 10000;

  const tours = await Tour.find({
    price: { $gte: minPrice, $lte: maxPrice },
  })
    .sort("price")
    .select("name price difficulty ratingsAverage duration");

  res.status(200).json({
    status: "success",
    count: tours.length,
    data: { tours },
  });
});

export const getTopCheapTours = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 5;

  const tours = await Tour.find()
    .sort("price")
    .limit(limit)
    .select("name price difficulty ratingsAverage duration");

  res.status(200).json({
    status: "success",
    count: tours.length,
    data: { tours },
  });
});

export const getToursByDifficulty = catchAsync(async (req, res) => {
  const { level } = req.params;
  const validLevels = ["easy", "medium", "difficult"];

  if (!validLevels.includes(level)) {
    throw new AppError(
      "Invalid difficulty level. Use: easy, medium, or difficult",
      400,
    );
  }

  const tours = await Tour.find({ difficulty: level })
    .sort("price")
    .select("name price duration ratingsAverage");

  res.status(200).json({
    status: "success",
    count: tours.length,
    data: { tours },
  });
});

export const getToursByRating = catchAsync(async (req, res) => {
  const minRating = parseFloat(req.query.minRating) || 4.5;
  const limit = parseInt(req.query.limit, 10) || 10;

  const tours = await Tour.find({
    ratingsAverage: { $gte: minRating },
  })
    .sort("-ratingsAverage")
    .limit(limit)
    .select("name price ratingsAverage ratingsQuantity difficulty");

  res.status(200).json({
    status: "success",
    count: tours.length,
    data: { tours },
  });
});

export const getToursByDuration = catchAsync(async (req, res) => {
  const maxDuration = parseInt(req.query.maxDuration, 10) || 7;
  const limit = parseInt(req.query.limit, 10) || 10;

  const tours = await Tour.find({
    duration: { $lte: maxDuration },
  })
    .sort("duration")
    .limit(limit)
    .select("name price duration difficulty ratingsAverage");

  res.status(200).json({
    status: "success",
    count: tours.length,
    data: { tours },
  });
});

export const searchTours = catchAsync(async (req, res) => {
  const {
    q,
    location,
    minPrice,
    maxPrice,
    difficulty,
    minRating,
    maxDuration,
  } = req.query;

  const tours = await TourQueryService.advancedSearch({
    q,
    location,
    minPrice,
    maxPrice,
    difficulty,
    minRating,
    maxDuration,
  });

  res.status(200).json({
    status: "success",
    count: tours.length,
    data: { tours },
  });
});

export const getTourStats = catchAsync(async (req, res) => {
  const [stats, overallStats] = await Promise.all([
    Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: "$difficulty",
          numTours: { $sum: 1 },
          numRatings: { $sum: "$ratingsQuantity" },
          avgRating: { $avg: "$ratingsAverage" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          totalRevenue: { $sum: "$price" },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
    ]),
    Tour.aggregate([
      {
        $group: {
          _id: null,
          totalTours: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          avgRating: { $avg: "$ratingsAverage" },
          totalRatings: { $sum: "$ratingsQuantity" },
          totalRevenue: { $sum: "$price" },
        },
      },
    ]),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      overall: overallStats[0] || {},
      byDifficulty: stats,
    },
  });
});

export const getMonthlyPlan = catchAsync(async (req, res) => {
  const year = parseInt(req.params.year, 10) || new Date().getFullYear();

  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" },
        avgPrice: { $avg: "$price" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: {
        _id: 0,
        month: 1,
        numTourStarts: 1,
        tours: { $slice: ["$tours", 5] },
        avgPrice: 1,
      },
    },
    {
      $sort: { month: 1 },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: plan,
  });
});

export const assignGuide = catchAsync(async (req, res) => {
  const { id: tourId } = req.params;
  const { guideId } = req.body;

  if (!guideId) {
    throw new AppError("Please provide guide ID", 400);
  }

  const guide = await User.findOne({
    _id: guideId,
    role: { $in: ["guide", "lead-guide"] },
    isActive: true,
  });

  if (!guide) {
    throw new AppError("Guide not found", 404);
  }

  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  if (!tour.guides.includes(guideId)) {
    tour.guides.push(guideId);
    await tour.save();
  }

  if (!guide.assignedTours.includes(tourId)) {
    guide.assignedTours.push(tourId);
    await guide.save();
  }

  res.status(200).json({
    status: "success",
    message: "Guide assigned successfully",
    data: { tour },
  });
});

export const assignMultipleGuides = catchAsync(async (req, res) => {
  const { id: tourId } = req.params;
  const { guideIds } = req.body;

  if (!guideIds || !Array.isArray(guideIds) || guideIds.length === 0) {
    throw new AppError("Please provide an array of guide IDs", 400);
  }

  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  const guides = await User.find({
    _id: { $in: guideIds },
    role: { $in: ["guide", "lead-guide"] },
    isActive: true,
  });

  if (guides.length !== guideIds.length) {
    throw new AppError("Some guides not found", 404);
  }

  const guideIdsToAdd = guides.map((guide) => guide._id);

  tour.guides = [...new Set([...tour.guides, ...guideIdsToAdd])];
  await tour.save();

  await User.updateMany(
    { _id: { $in: guideIdsToAdd } },
    { $addToSet: { assignedTours: tourId } },
  );

  res.status(200).json({
    status: "success",
    message: "Guides assigned successfully",
    data: { tour },
  });
});

export const removeGuide = catchAsync(async (req, res) => {
  const { id: tourId, guideId } = req.params;

  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  tour.guides = tour.guides.filter((id) => id.toString() !== guideId);
  await tour.save();

  await User.findByIdAndUpdate(guideId, { $pull: { assignedTours: tourId } });

  res.status(200).json({
    status: "success",
    message: "Guide removed successfully",
    data: { tour },
  });
});

export const getAssignedTours = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "assignedTours",
    select: "name slug price duration difficulty ratingsAverage",
  });

  res.status(200).json({
    status: "success",
    count: user.assignedTours.length,
    data: { tours: user.assignedTours },
  });
});
