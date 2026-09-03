import Tour from "../models/Tour.js";
import User from "../models/User.js";
import Review from "../models/Review.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";
import TourQueryService from "../services/tourQueryService.js";
import {
  deleteOne,
  deleteMany,
  restoreOne,
  permanentDeleteOne,
  cascadeDeleteOne,
} from "../utils/handlerFactory.js";

const populateGuideFields = (query, populateOptions = {}) => {
  const {
    populateGuides = true,
    populateLeadGuide = true,
    populateAssistantGuides = false,
    populateGuideAssignments = false,
    populateGuideRatings = false,
    populateBackupGuides = false,
    populateAll = false,
    populateReviewers = false,
    populateItineraryGuides = false,
  } = populateOptions;

  let populatedQuery = query;

  if (populateAll) {
    return populatedQuery
      .populate({
        path: "guides",
        select: "name email role profileImage bio languages expertise",
      })
      .populate({
        path: "guideDetails.leadGuide",
        select: "name email role profileImage bio languages expertise",
      })
      .populate({
        path: "guideDetails.assistantGuides",
        select: "name email role profileImage bio languages expertise",
      })
      .populate({
        path: "guideDetails.guideAssignments.guideId",
        select: "name email role profileImage bio languages expertise",
      })
      .populate({
        path: "guideDetails.scheduling.backupGuides",
        select: "name email role profileImage bio",
      })
      .populate({
        path: "guideRatings.guideId",
        select: "name email profileImage",
      })
      .populate({
        path: "guideRatings.reviewerId",
        select: "name email",
      })
      .populate({
        path: "itinerary.assignedGuides.guideId",
        select: "name email role profileImage",
      });
  }

  if (populateGuides) {
    populatedQuery = populatedQuery.populate({
      path: "guides",
      select: "name email role profileImage bio languages expertise",
    });
  }

  if (populateLeadGuide) {
    populatedQuery = populatedQuery.populate({
      path: "guideDetails.leadGuide",
      select: "name email role profileImage bio languages expertise",
    });
  }

  if (populateAssistantGuides) {
    populatedQuery = populatedQuery.populate({
      path: "guideDetails.assistantGuides",
      select: "name email role profileImage bio languages expertise",
    });
  }

  if (populateGuideAssignments) {
    populatedQuery = populatedQuery.populate({
      path: "guideDetails.guideAssignments.guideId",
      select: "name email role profileImage bio languages expertise",
    });
  }

  if (populateGuideRatings) {
    populatedQuery = populatedQuery.populate({
      path: "guideRatings.guideId",
      select: "name email profileImage",
    });
  }

  if (populateReviewers && populateGuideRatings) {
    populatedQuery = populatedQuery.populate({
      path: "guideRatings.reviewerId",
      select: "name email",
    });
  }

  if (populateBackupGuides) {
    populatedQuery = populatedQuery.populate({
      path: "guideDetails.scheduling.backupGuides",
      select: "name email role profileImage bio",
    });
  }

  if (populateItineraryGuides) {
    populatedQuery = populatedQuery.populate({
      path: "itinerary.assignedGuides.guideId",
      select: "name email role profileImage",
    });
  }

  return populatedQuery;
};

const populateReviewVirtuals = (query, options = {}) => {
  const {
    populateReviews = true,
    reviewType = "approved",
    reviewLimit = 10,
    reviewSort = "-createdAt",
    populateReviewUsers = true,
    populateReviewTour = false,
    reviewsOnly = false,
  } = options;

  let populatedQuery = query;

  if (!populateReviews) {
    return populatedQuery;
  }

  let virtualField = "reviews";

  if (reviewType === "all") virtualField = "allReviews";
  else if (reviewType === "recent") virtualField = "recentReviews";
  else if (reviewType === "top") virtualField = "topReviews";

  if (!reviewsOnly) {
    populatedQuery = populatedQuery.populate({
      path: virtualField,
      options: {
        limit: reviewLimit,
        sort: reviewSort,
      },
    });
  }

  if (populateReviewUsers && !reviewsOnly) {
    populatedQuery = populatedQuery.populate({
      path: `${virtualField}.user`,
      select: "name email profileImage role bio",
    });
  }

  if (populateReviewTour && !reviewsOnly) {
    populatedQuery = populatedQuery.populate({
      path: `${virtualField}.tour`,
      select: "name slug price duration difficulty imageCover",
    });
  }

  return populatedQuery;
};

const deleteTour = cascadeDeleteOne(Tour, {
  modelName: "Tour",
  idParam: "id",
  cascadeModels: [
    {
      model: Review,
      foreignField: "tour",
      modelName: "Reviews",
    },
  ],
  beforeCascadeDelete: async (doc) => {
    if (doc.guides && doc.guides.length > 0) {
      await User.updateMany(
        { assignedTours: doc._id },
        { $pull: { assignedTours: doc._id } },
      );
    }
  },

  afterCascadeDelete: (doc, cascadeResults) => {
    console.log(
      `Tour ${doc._id} deleted with ${cascadeResults.Reviews?.deletedCount || 0} reviews`,
    );
  },
});

const softDeleteTour = deleteOne(Tour, {
  modelName: "Tour",
  softDelete: true,
  idParam: "id",
  beforeDelete: async (doc) => {
    if (doc.guides && doc.guides.length > 0) {
      await User.updateMany(
        { assignedTours: doc._id },
        { $pull: { assignedTours: doc._id } },
      );
    }
  },
});

const restoreTour = restoreOne(Tour, {
  modelName: "Tour",
  idParam: "id",
  afterRestore: async (doc) => {
    if (doc.guides && doc.guides.length > 0) {
      await User.updateMany(
        { _id: { $in: doc.guides } },
        { $addToSet: { assignedTours: doc._id } },
      );
    }
  },
});

const permanentDeleteTour = permanentDeleteOne(Tour, {
  modelName: "Tour",
  idParam: "id",
});

const bulkDeleteTours = deleteMany(Tour, {
  modelName: "Tour",
  softDelete: false,
  maxDeleteLimit: 50,
  beforeBulkDelete: async (docs) => {
    const tourIds = docs.map((doc) => doc._id);

    await User.updateMany(
      { assignedTours: { $in: tourIds } },
      { $pull: { assignedTours: { $in: tourIds } } },
    );
  },
});

const getAllTours = catchAsync(async (req, res) => {
  const { tours, pagination, count } =
    await TourQueryService.executePaginatedQuery(req.query);

  const populateAll = req.query.populateAll === "true";
  const populateGuides = req.query.populateGuides !== "false";
  const populateLeadGuide = req.query.populateLeadGuide !== "false";
  const populateAssistantGuides = req.query.populateAssistantGuides === "true";
  const populateGuideAssignments =
    req.query.populateGuideAssignments === "true";
  const populateGuideRatings = req.query.populateGuideRatings === "true";

  const populateReviews = req.query.populateReviews !== "false";
  const reviewType = req.query.reviewType || "approved";
  const reviewLimit = parseInt(req.query.reviewLimit, 10) || 3;
  const reviewSort = req.query.reviewSort || "-createdAt";
  const populateReviewUsers = req.query.populateReviewUsers !== "false";

  const tourIds = tours.map((tour) => tour._id);

  let query = Tour.find({ _id: { $in: tourIds } });

  query = populateGuideFields(query, {
    populateAll,
    populateGuides,
    populateLeadGuide,
    populateAssistantGuides,
    populateGuideAssignments,
    populateGuideRatings,
  });

  query = populateReviewVirtuals(query, {
    populateReviews,
    reviewType,
    reviewLimit,
    reviewSort,
    populateReviewUsers,
  });

  const populatedTours = await query.lean();

  res.status(200).json({
    status: "success",
    results: count,
    pagination,
    data: { tours: populatedTours },
  });
});

/**
 * Get a single tour by ID or slug
 */
const getTour = catchAsync(async (req, res) => {
  const { id } = req.params;
  const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);

  const populateAll = req.query.populateAll === "true";
  const populateGuides = req.query.populateGuides !== "false";
  const populateLeadGuide = req.query.populateLeadGuide !== "false";
  const populateAssistantGuides = req.query.populateAssistantGuides === "true";
  const populateGuideAssignments =
    req.query.populateGuideAssignments === "true";
  const populateGuideRatings = req.query.populateGuideRatings === "true";
  const populateBackupGuides = req.query.populateBackupGuides === "true";
  const populateReviewers = req.query.populateReviewers === "true";
  const populateItineraryGuides = req.query.populateItineraryGuides === "true";

  const populateReviews = req.query.populateReviews !== "false";
  const reviewType = req.query.reviewType || "approved";
  const reviewLimit = parseInt(req.query.reviewLimit, 10) || 10;
  const reviewSort = req.query.reviewSort || "-createdAt";
  const populateReviewUsers = req.query.populateReviewUsers !== "false";
  const populateReviewTour = req.query.populateReviewTour === "true";
  const reviewsOnly = req.query.reviewsOnly === "true";

  let query;

  if (isMongoId) {
    query = Tour.findById(id);
  } else {
    query = Tour.findOne({ slug: id });
  }

  query = populateGuideFields(query, {
    populateAll,
    populateGuides,
    populateLeadGuide,
    populateAssistantGuides,
    populateGuideAssignments,
    populateGuideRatings,
    populateBackupGuides,
    populateReviewers,
    populateItineraryGuides,
  });

  query = populateReviewVirtuals(query, {
    populateReviews,
    reviewType,
    reviewLimit,
    reviewSort,
    populateReviewUsers,
    populateReviewTour,
    reviewsOnly,
  });

  const tour = await query.lean();

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

/**
 * Create a new tour
 */
const createTour = catchAsync(async (req, res) => {
  const tourData = {
    ...req.body,
    createdBy: req.user._id,
  };

  if (req.user.role === "lead-guide") {
    tourData.guides = tourData.guides || [];
    if (!tourData.guides.includes(req.user._id)) {
      tourData.guides.push(req.user._id);
    }

    if (!tourData.guideDetails) {
      tourData.guideDetails = {};
    }
    if (!tourData.guideDetails.leadGuide) {
      tourData.guideDetails.leadGuide = req.user._id;
    }
  }

  if (tourData.guideDetails && tourData.guideDetails.requirements) {
    const { minGuides, maxGuides } = tourData.guideDetails.requirements;
    const guideCount = tourData.guides ? tourData.guides.length : 0;

    if (minGuides && guideCount < minGuides) {
      throw new AppError(`Tour requires at least ${minGuides} guides`, 400);
    }

    if (maxGuides && guideCount > maxGuides) {
      throw new AppError(`Tour cannot have more than ${maxGuides} guides`, 400);
    }
  }

  const tour = await Tour.create(tourData);

  if (tour.guides && tour.guides.length > 0) {
    await User.updateMany(
      { _id: { $in: tour.guides } },
      { $addToSet: { assignedTours: tour._id } },
    );
  }

  const populatedTour = await Tour.findById(tour._id)
    .populate({
      path: "guides",
      select: "name email role profileImage bio",
    })
    .populate({
      path: "guideDetails.leadGuide",
      select: "name email role profileImage bio",
    })
    .populate({
      path: "guideDetails.assistantGuides",
      select: "name email role profileImage bio",
    })
    .populate({
      path: "reviews",
      options: { limit: 5, sort: "-createdAt" },
      populate: {
        path: "user",
        select: "name email profileImage",
      },
    })
    .lean();

  res.status(201).json({
    status: "success",
    data: { tour: populatedTour },
  });
});

/**
 * Update a tour
 */
const updateTour = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  if (updateData.guides) {
    if (updateData.guideDetails && updateData.guideDetails.requirements) {
      const { minGuides, maxGuides } = updateData.guideDetails.requirements;
      const guideCount = updateData.guides.length;

      if (minGuides && guideCount < minGuides) {
        throw new AppError(`Tour requires at least ${minGuides} guides`, 400);
      }

      if (maxGuides && guideCount > maxGuides) {
        throw new AppError(
          `Tour cannot have more than ${maxGuides} guides`,
          400,
        );
      }
    }

    if (updateData.guideDetails && updateData.guideDetails.leadGuide) {
      if (!updateData.guides.includes(updateData.guideDetails.leadGuide)) {
        throw new AppError("Lead guide must be in the guides array", 400);
      }
    }
  }

  const tour = await Tour.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  if (updateData.guides) {
    const currentTour = await Tour.findById(id);
    const currentGuideIds = currentTour.guides.map((id) => id.toString());
    const newGuideIds = updateData.guides.map((id) => id.toString());

    const guidesToAdd = newGuideIds.filter(
      (id) => !currentGuideIds.includes(id),
    );
    const guidesToRemove = currentGuideIds.filter(
      (id) => !newGuideIds.includes(id),
    );

    if (guidesToAdd.length > 0) {
      await User.updateMany(
        { _id: { $in: guidesToAdd } },
        { $addToSet: { assignedTours: tour._id } },
      );
    }

    if (guidesToRemove.length > 0) {
      await User.updateMany(
        { _id: { $in: guidesToRemove } },
        { $pull: { assignedTours: tour._id } },
      );
    }
  }

  const populatedTour = await Tour.findById(tour._id)
    .populate({
      path: "guides",
      select: "name email role profileImage bio languages expertise",
    })
    .populate({
      path: "guideDetails.leadGuide",
      select: "name email role profileImage bio languages expertise",
    })
    .populate({
      path: "guideDetails.assistantGuides",
      select: "name email role profileImage bio languages expertise",
    })
    .populate({
      path: "guideDetails.guideAssignments.guideId",
      select: "name email role profileImage",
    })
    .populate({
      path: "reviews",
      options: { limit: 5, sort: "-createdAt" },
      populate: {
        path: "user",
        select: "name email profileImage",
      },
    })
    .lean();

  res.status(200).json({
    status: "success",
    data: { tour: populatedTour },
  });
});

const getTourWithReviews = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    reviewPage = 1,
    reviewLimit = 10,
    reviewSort = "-createdAt",
    reviewMinRating,
    reviewMaxRating,
  } = req.query;

  const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);

  let query;

  if (isMongoId) {
    query = Tour.findById(id);
  } else {
    query = Tour.findOne({ slug: id });
  }

  query = query
    .populate({
      path: "guides",
      select: "name email role profileImage",
    })
    .populate({
      path: "guideDetails.leadGuide",
      select: "name email role profileImage",
    });

  const tour = await query.lean();

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  const ReviewModel = (await import("../models/Review.js")).default;

  const reviewQuery = ReviewModel.find({
    tour: tour._id,
    status: "approved",
  });

  if (reviewMinRating) {
    reviewQuery.where("rating").gte(parseFloat(reviewMinRating));
  }
  if (reviewMaxRating) {
    reviewQuery.where("rating").lte(parseFloat(reviewMaxRating));
  }

  const pageNum = parseInt(reviewPage, 10);
  const limitNum = parseInt(reviewLimit, 10);
  const skip = (pageNum - 1) * limitNum;

  reviewQuery.sort(reviewSort).skip(skip).limit(limitNum).populate({
    path: "user",
    select: "name email profileImage",
  });

  const reviews = await reviewQuery.lean();
  const totalReviews = await ReviewModel.countDocuments({
    tour: tour._id,
    status: "approved",
  });

  const stats = await ReviewModel.getReviewStats(tour._id);

  const distribution = await ReviewModel.getRatingDistribution(tour._id);

  res.status(200).json({
    status: "success",
    data: {
      tour,
      reviews: {
        data: reviews,
        total: totalReviews,
        page: pageNum,
        pages: Math.ceil(totalReviews / limitNum),
        limit: limitNum,
      },
      stats: stats || {
        totalReviews: 0,
        averageRating: 0,
        minRating: 0,
        maxRating: 0,
        totalRatingSum: 0,
        verifiedPurchases: 0,
        recommendedCount: 0,
        totalHelpful: 0,
        recommendationRate: 0,
        verifiedRate: 0,
        averageHelpfulPerReview: 0,
      },
      distribution: distribution || {
        distribution: [],
        percentages: [],
        total: 0,
      },
    },
  });
});

/**
 * Get tours by price range
 */
const getToursByPriceRange = catchAsync(async (req, res) => {
  const minPrice = parseInt(req.query.min, 10) || 0;
  const maxPrice = parseInt(req.query.max, 10) || 10000;
  const populateGuides = req.query.populateGuides !== "false";
  const populateReviews = req.query.populateReviews !== "false";

  let query = Tour.find({
    price: { $gte: minPrice, $lte: maxPrice },
  })
    .sort("price")
    .select("name price difficulty ratingsAverage duration");

  if (populateGuides) {
    query = query.populate({
      path: "guides",
      select: "name email role profileImage",
    });
  }

  if (populateReviews) {
    query = query.populate({
      path: "reviews",
      options: { limit: 3, sort: "-createdAt" },
      populate: {
        path: "user",
        select: "name email profileImage",
      },
    });
  }

  const tours = await query.lean();

  res.status(200).json({
    status: "success",
    count: tours.length,
    data: { tours },
  });
});

/**
 * Get top cheap tours
 */
const getTopCheapTours = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 5;
  const populateGuides = req.query.populateGuides !== "false";

  let query = Tour.find()
    .sort("price")
    .limit(limit)
    .select("name price difficulty ratingsAverage duration");

  if (populateGuides) {
    query = query.populate({
      path: "guides",
      select: "name email role profileImage",
    });
  }

  query = query.populate({
    path: "reviews",
    options: { limit: 2, sort: "-createdAt" },
    populate: {
      path: "user",
      select: "name email profileImage",
    },
  });

  const tours = await query.lean();

  res.status(200).json({
    status: "success",
    count: tours.length,
    data: { tours },
  });
});

/**
 * Get tours by difficulty
 */
const getToursByDifficulty = catchAsync(async (req, res) => {
  const { level } = req.params;
  const validLevels = ["easy", "medium", "difficult"];

  if (!validLevels.includes(level)) {
    throw new AppError(
      "Invalid difficulty level. Use: easy, medium, or difficult",
      400,
    );
  }

  const populateGuides = req.query.populateGuides !== "false";

  let query = Tour.find({ difficulty: level })
    .sort("price")
    .select("name price duration ratingsAverage");

  if (populateGuides) {
    query = query.populate({
      path: "guides",
      select: "name email role profileImage",
    });
  }

  query = query.populate({
    path: "reviews",
    options: { limit: 3, sort: "-createdAt" },
    populate: {
      path: "user",
      select: "name email profileImage",
    },
  });

  const tours = await query.lean();

  res.status(200).json({
    status: "success",
    count: tours.length,
    data: { tours },
  });
});

/**
 * Get tours by rating
 */
const getToursByRating = catchAsync(async (req, res) => {
  const minRating = parseFloat(req.query.minRating) || 4.5;
  const limit = parseInt(req.query.limit, 10) || 10;
  const populateGuides = req.query.populateGuides !== "false";

  let query = Tour.find({
    ratingsAverage: { $gte: minRating },
  })
    .sort("-ratingsAverage")
    .limit(limit)
    .select("name price ratingsAverage ratingsQuantity difficulty");

  if (populateGuides) {
    query = query.populate({
      path: "guides",
      select: "name email role profileImage",
    });
  }

  query = query.populate({
    path: "reviews",
    options: { limit: 3, sort: "-rating" },
    populate: {
      path: "user",
      select: "name email profileImage",
    },
  });

  const tours = await query.lean();

  res.status(200).json({
    status: "success",
    count: tours.length,
    data: { tours },
  });
});

/**
 * Get tours by duration
 */
const getToursByDuration = catchAsync(async (req, res) => {
  const maxDuration = parseInt(req.query.maxDuration, 10) || 7;
  const limit = parseInt(req.query.limit, 10) || 10;
  const populateGuides = req.query.populateGuides !== "false";

  let query = Tour.find({
    duration: { $lte: maxDuration },
  })
    .sort("duration")
    .limit(limit)
    .select("name price duration difficulty ratingsAverage");

  if (populateGuides) {
    query = query.populate({
      path: "guides",
      select: "name email role profileImage",
    });
  }

  query = query.populate({
    path: "reviews",
    options: { limit: 3, sort: "-createdAt" },
    populate: {
      path: "user",
      select: "name email profileImage",
    },
  });

  const tours = await query.lean();

  res.status(200).json({
    status: "success",
    count: tours.length,
    data: { tours },
  });
});

/**
 * Search tours
 */
const searchTours = catchAsync(async (req, res) => {
  const {
    q,
    location,
    minPrice,
    maxPrice,
    difficulty,
    minRating,
    maxDuration,
    populateGuides = "true",
    populateReviews = "true",
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

  let populatedTours = tours;

  if (populateGuides !== "false" || populateReviews !== "false") {
    const tourIds = tours.map((tour) => tour._id);
    let query = Tour.find({ _id: { $in: tourIds } });

    if (populateGuides !== "false") {
      query = populateGuideFields(query, {
        populateGuides: true,
        populateLeadGuide: true,
      });
    }

    if (populateReviews !== "false") {
      query = query.populate({
        path: "reviews",
        options: { limit: 3, sort: "-createdAt" },
        populate: {
          path: "user",
          select: "name email profileImage",
        },
      });
    }

    populatedTours = await query.lean();
  }

  res.status(200).json({
    status: "success",
    count: populatedTours.length,
    data: { tours: populatedTours },
  });
});

/**
 * Get tour statistics
 */
const getTourStats = catchAsync(async (req, res) => {
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
          totalGuides: { $sum: { $size: "$guides" } },
          avgGuidesPerTour: { $avg: { $size: "$guides" } },
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
          totalGuides: { $sum: { $size: "$guides" } },
          avgGuidesPerTour: { $avg: { $size: "$guides" } },
          maxGuidesInTour: { $max: { $size: "$guides" } },
          minGuidesInTour: { $min: { $size: "$guides" } },
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

/**
 * Get monthly plan
 */
const getMonthlyPlan = catchAsync(async (req, res) => {
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
        totalGuides: { $sum: { $size: "$guides" } },
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
        totalGuides: 1,
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

const assignGuide = catchAsync(async (req, res) => {
  const { id: tourId } = req.params;
  const { guideId, role = "assistant", startDate, endDate } = req.body;

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

  const requirements = tour.guideDetails?.requirements || {};
  const maxGuides = requirements.maxGuides || 5;

  if (tour.guides && tour.guides.length >= maxGuides) {
    throw new AppError(`Maximum guide capacity of ${maxGuides} reached`, 400);
  }

  await tour.addGuide(guideId, role, startDate || new Date(), endDate);
  await tour.save();

  if (!guide.assignedTours.includes(tourId)) {
    guide.assignedTours.push(tourId);
    await guide.save();
  }

  const populatedTour = await Tour.findById(tourId)
    .populate({
      path: "guides",
      select: "name email role profileImage bio",
    })
    .populate({
      path: "guideDetails.leadGuide",
      select: "name email role profileImage bio",
    })
    .populate({
      path: "guideDetails.guideAssignments.guideId",
      select: "name email role profileImage",
    })
    .populate({
      path: "reviews",
      options: { limit: 3, sort: "-createdAt" },
      populate: {
        path: "user",
        select: "name email profileImage",
      },
    })
    .lean();

  res.status(200).json({
    status: "success",
    message: "Guide assigned successfully",
    data: { tour: populatedTour },
  });
});

/**
 * Assign multiple guides to a tour
 */
const assignMultipleGuides = catchAsync(async (req, res) => {
  const { id: tourId } = req.params;
  const { guideAssignments } = req.body;

  if (
    !guideAssignments ||
    !Array.isArray(guideAssignments) ||
    guideAssignments.length === 0
  ) {
    throw new AppError("Please provide an array of guide assignments", 400);
  }

  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  const guideIds = guideAssignments.map((ga) => ga.guideId);

  const guides = await User.find({
    _id: { $in: guideIds },
    role: { $in: ["guide", "lead-guide"] },
    isActive: true,
  });

  if (guides.length !== guideIds.length) {
    throw new AppError("Some guides not found", 404);
  }

  const assignmentsToAdd = [];
  const existingGuideIds = tour.guides || [];

  for (const assignment of guideAssignments) {
    if (!existingGuideIds.includes(assignment.guideId)) {
      const requirements = tour.guideDetails?.requirements || {};
      const maxGuides = requirements.maxGuides || 5;

      if (tour.guides && tour.guides.length >= maxGuides) {
        break;
      }

      assignmentsToAdd.push(assignment);
    }
  }

  if (assignmentsToAdd.length > 0) {
    await Promise.all(
      assignmentsToAdd.map((assignment) =>
        tour.addGuide(
          assignment.guideId,
          assignment.role || "assistant",
          assignment.startDate || new Date(),
          assignment.endDate,
        ),
      ),
    );
    await tour.save();
  }

  const guideIdsToAdd = guides.map((g) => g._id);

  await User.updateMany(
    { _id: { $in: guideIdsToAdd } },
    { $addToSet: { assignedTours: tourId } },
  );

  const populatedTour = await Tour.findById(tourId)
    .populate({
      path: "guides",
      select: "name email role profileImage bio",
    })
    .populate({
      path: "guideDetails.leadGuide",
      select: "name email role profileImage bio",
    })
    .populate({
      path: "guideDetails.guideAssignments.guideId",
      select: "name email role profileImage",
    })
    .populate({
      path: "reviews",
      options: { limit: 3, sort: "-createdAt" },
      populate: {
        path: "user",
        select: "name email profileImage",
      },
    })
    .lean();

  res.status(200).json({
    status: "success",
    message: "Guides assigned successfully",
    data: { tour: populatedTour },
  });
});

/**
 * Remove a guide from a tour
 */
const removeGuide = catchAsync(async (req, res) => {
  const { id: tourId, guideId } = req.params;

  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  if (tour.guideDetails && tour.guideDetails.leadGuide) {
    if (tour.guideDetails.leadGuide.toString() === guideId) {
      throw new AppError(
        "Cannot remove lead guide. Assign another lead guide first.",
        400,
      );
    }
  }

  await tour.removeGuide(guideId);
  await tour.save();

  await User.findByIdAndUpdate(guideId, { $pull: { assignedTours: tourId } });

  const populatedTour = await Tour.findById(tourId)
    .populate({
      path: "guides",
      select: "name email role profileImage bio",
    })
    .populate({
      path: "guideDetails.leadGuide",
      select: "name email role profileImage bio",
    })
    .populate({
      path: "guideDetails.guideAssignments.guideId",
      select: "name email role profileImage",
    })
    .populate({
      path: "reviews",
      options: { limit: 3, sort: "-createdAt" },
      populate: {
        path: "user",
        select: "name email profileImage",
      },
    })
    .lean();

  res.status(200).json({
    status: "success",
    message: "Guide removed successfully",
    data: { tour: populatedTour },
  });
});

/**
 * Get assigned tours for a user
 */
const getAssignedTours = catchAsync(async (req, res) => {
  const populateGuides = req.query.populateGuides !== "false";
  const populateGuideDetails = req.query.populateGuideDetails === "true";
  const populateReviews = req.query.populateReviews !== "false";

  let query = User.findById(req.user._id).populate({
    path: "assignedTours",
    select:
      "name slug price duration difficulty ratingsAverage ratingsQuantity imageCover summary startDates guides",
  });

  if (populateGuides) {
    query = query.populate({
      path: "assignedTours.guides",
      select: "name email role profileImage bio languages expertise",
    });
  }

  if (populateGuideDetails) {
    query = query
      .populate({
        path: "assignedTours.guideDetails.leadGuide",
        select: "name email role profileImage bio",
      })
      .populate({
        path: "assignedTours.guideDetails.assistantGuides",
        select: "name email role profileImage bio",
      });
  }

  if (populateReviews) {
    query = query.populate({
      path: "assignedTours.reviews",
      options: { limit: 3, sort: "-createdAt" },
      populate: {
        path: "user",
        select: "name email profileImage",
      },
    });
  }

  const user = await query.lean();

  res.status(200).json({
    status: "success",
    count: user.assignedTours.length,
    data: { tours: user.assignedTours },
  });
});

/**
 * Set lead guide
 */
const setLeadGuide = catchAsync(async (req, res) => {
  const { id: tourId } = req.params;
  const { guideId } = req.body;

  if (!guideId) {
    throw new AppError("Please provide guide ID", 400);
  }

  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  if (!tour.isGuideAssigned(guideId)) {
    throw new AppError("Guide must be assigned to the tour first", 400);
  }

  await tour.setLeadGuide(guideId);
  await tour.save();

  const populatedTour = await Tour.findById(tourId)
    .populate({
      path: "guides",
      select: "name email role profileImage bio",
    })
    .populate({
      path: "guideDetails.leadGuide",
      select: "name email role profileImage bio",
    })
    .populate({
      path: "guideDetails.guideAssignments.guideId",
      select: "name email role profileImage",
    })
    .populate({
      path: "reviews",
      options: { limit: 3, sort: "-createdAt" },
      populate: {
        path: "user",
        select: "name email profileImage",
      },
    })
    .lean();

  res.status(200).json({
    status: "success",
    message: "Lead guide updated successfully",
    data: { tour: populatedTour },
  });
});

/**
 * Get guide details
 */
const getGuideDetails = catchAsync(async (req, res) => {
  const { id: tourId, guideId } = req.params;

  const tour = await Tour.findById(tourId)
    .populate({
      path: "guides",
      select: "name email role profileImage bio languages expertise",
    })
    .populate({
      path: "guideDetails.leadGuide",
      select: "name email role profileImage bio languages expertise",
    })
    .populate({
      path: "guideDetails.guideAssignments.guideId",
      select: "name email role profileImage",
    })
    .populate({
      path: "guideRatings.guideId",
      select: "name email profileImage",
    })
    .lean();

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  const guideDetails = {
    guide: null,
    assignment: null,
    rating: null,
    role: null,
  };

  if (tour.guides) {
    const guideIndex = tour.guides.findIndex(
      (g) => g._id.toString() === guideId,
    );

    if (guideIndex !== -1) {
      guideDetails.guide = tour.guides[guideIndex];
    }
  }

  if (tour.guideDetails && tour.guideDetails.leadGuide) {
    if (tour.guideDetails.leadGuide._id.toString() === guideId) {
      guideDetails.role = "lead";
    }
  }

  if (tour.guideDetails && tour.guideDetails.guideAssignments) {
    const assignment = tour.guideDetails.guideAssignments.find(
      (a) => a.guideId._id.toString() === guideId,
    );

    if (assignment) {
      guideDetails.assignment = assignment;
      if (!guideDetails.role) {
        guideDetails.role = assignment.role;
      }
    }
  }

  if (tour.guideRatings) {
    const ratings = tour.guideRatings.filter(
      (r) => r.guideId._id.toString() === guideId,
    );

    if (ratings.length > 0) {
      guideDetails.rating = {
        average: ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length,
        count: ratings.length,
        ratings,
      };
    }
  }

  if (!guideDetails.guide) {
    throw new AppError("Guide not found in this tour", 404);
  }

  res.status(200).json({
    status: "success",
    data: { guideDetails },
  });
});

/**
 * Add guide rating
 */
const addGuideRating = catchAsync(async (req, res) => {
  const { id: tourId } = req.params;
  const { guideId, rating, review, categories } = req.body;

  if (!guideId || !rating) {
    throw new AppError("Please provide guide ID and rating", 400);
  }

  if (rating < 1 || rating > 5) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  if (!tour.isGuideAssigned(guideId)) {
    throw new AppError("Guide must be assigned to the tour", 400);
  }

  const existingRating = tour.guideRatings?.find(
    (r) =>
      r.guideId.toString() === guideId &&
      r.reviewerId &&
      r.reviewerId.toString() === req.user._id.toString(),
  );

  if (existingRating) {
    throw new AppError("You have already rated this guide for this tour", 400);
  }

  tour.addGuideRating(
    guideId,
    rating,
    review || "",
    req.user._id,
    categories || {},
  );
  await tour.save();

  const populatedTour = await Tour.findById(tourId)
    .populate({
      path: "guideRatings.guideId",
      select: "name email profileImage",
    })
    .populate({
      path: "guideRatings.reviewerId",
      select: "name email",
    })
    .populate({
      path: "reviews",
      options: { limit: 3, sort: "-createdAt" },
      populate: {
        path: "user",
        select: "name email profileImage",
      },
    })
    .lean();

  res.status(200).json({
    status: "success",
    message: "Guide rating added successfully",
    data: { tour: populatedTour },
  });
});

export {
  deleteTour,
  softDeleteTour,
  restoreTour,
  permanentDeleteTour,
  bulkDeleteTours,
  getAllTours,
  getTour,
  createTour,
  updateTour,
  getTourWithReviews,
  getToursByPriceRange,
  getTopCheapTours,
  getToursByDifficulty,
  getToursByRating,
  getToursByDuration,
  searchTours,
  getTourStats,
  getMonthlyPlan,
  assignGuide,
  assignMultipleGuides,
  removeGuide,
  getAssignedTours,
  setLeadGuide,
  getGuideDetails,
  addGuideRating,
};
