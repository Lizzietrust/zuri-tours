import Tour from "../models/Tour.js";
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

export const getTour = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);

  const tour = isMongoId
    ? await TourQueryService.getTourById(id)
    : await TourQueryService.getTourBySlug(id);

  if (!tour) {
    return next(new AppError("Tour not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { tour },
  });
});

export const createTour = catchAsync(async (req, res) => {
  const tour = await Tour.create(req.body);

  res.status(201).json({
    status: "success",
    data: { tour },
  });
});

export const updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!tour) {
    return next(new AppError("Tour not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { tour },
  });
});

export const deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError("Tour not found", 404));
  }

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

export const getToursByDifficulty = catchAsync(async (req, res, next) => {
  const { level } = req.params;
  const validLevels = ["easy", "medium", "difficult"];

  if (!validLevels.includes(level)) {
    return next(
      new AppError(
        "Invalid difficulty level. Use: easy, medium, or difficult",
        400,
      ),
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
