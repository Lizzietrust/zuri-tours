import Tour from "../models/Tour.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = [
      "page",
      "sort",
      "limit",
      "fields",
      "search",
      "minPrice",
      "maxPrice",
      "minRating",
    ];

    excludedFields.forEach((field) => delete queryObj[field]);

    let queryStr = JSON.stringify(queryObj);

    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");

      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");

      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  search() {
    if (this.queryString.search) {
      const searchTerm = this.queryString.search;

      this.query = this.query.find({
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { summary: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
          { location: { $regex: searchTerm, $options: "i" } },
        ],
      });
    }

    return this;
  }

  priceRange() {
    const minPrice = parseInt(this.queryString.minPrice, 10) || 0;
    const maxPrice = parseInt(this.queryString.maxPrice, 10) || 10000;

    this.query = this.query.find({
      price: { $gte: minPrice, $lte: maxPrice },
    });

    return this;
  }

  ratingFilter() {
    const minRating = parseFloat(this.queryString.minRating) || 0;

    this.query = this.query.find({
      ratingsAverage: { $gte: minRating },
    });

    return this;
  }
}

export const getAllTours = catchAsync(async (req, res) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .search()
    .priceRange()
    .ratingFilter()
    .sort()
    .limitFields()
    .paginate();

  const [tours, totalCount] = await Promise.all([
    features.query,
    Tour.countDocuments(features.query._conditions),
  ]);

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100;
  const totalPages = Math.ceil(totalCount / limit);

  res.status(200).json({
    status: "success",
    results: tours.length,
    pagination: {
      currentPage: page,
      limit,
      totalPages,
      totalItems: totalCount,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
    data: { tours },
  });
});

export const getTour = catchAsync(async (req, res, next) => {
  let tour;

  if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    tour = await Tour.findById(req.params.id)
      .populate({
        path: "reviews",
        select: "review rating user createdAt",
      })
      .populate({
        path: "guides",
        select: "name email photo",
      });
  } else {
    tour = await Tour.findOne({ slug: req.params.id })
      .populate({
        path: "reviews",
        select: "review rating user createdAt",
      })
      .populate({
        path: "guides",
        select: "name email photo",
      });
  }

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
  const { q, location, minPrice, maxPrice, difficulty } = req.query;

  const searchQuery = {};

  if (q) {
    searchQuery.$or = [
      { name: { $regex: q, $options: "i" } },
      { summary: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  if (location) {
    searchQuery.location = { $regex: location, $options: "i" };
  }

  if (minPrice || maxPrice) {
    searchQuery.price = {};
    if (minPrice) searchQuery.price.$gte = parseInt(minPrice, 10);
    if (maxPrice) searchQuery.price.$lte = parseInt(maxPrice, 10);
  }

  if (difficulty) {
    const validLevels = ["easy", "medium", "difficult"];

    if (validLevels.includes(difficulty)) {
      searchQuery.difficulty = difficulty;
    }
  }

  const tours = await Tour.find(searchQuery)
    .sort("-createdAt")
    .select("name price difficulty duration ratingsAverage location");

  res.status(200).json({
    status: "success",
    count: tours.length,
    data: { tours },
  });
});
