import Review from "../models/Review.js";
import Tour from "../models/Tour.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";
import {
  deleteOne,
  deleteMany,
  restoreOne,
  permanentDeleteOne,
  createOne,
  updateOne,
  getAll,
  getOne,
} from "../utils/handlerFactory.js";

/* ============================================================
   POPULATION HELPERS
   ============================================================ */

const POPULATION_CONFIG = {
  user: {
    path: "user",
    select: "name email profileImage role bio",
  },
  tour: {
    path: "tour",
    select:
      "name slug price duration difficulty imageCover ratingsAverage ratingsQuantity",
  },
  responseUser: {
    path: "response.respondedBy",
    select: "name email role profileImage",
  },
  flagUsers: {
    path: "flagReasons.flaggedBy",
    select: "name email role",
  },
  editHistory: {
    path: "editHistory.editedBy",
    select: "name email role",
  },
  attachments: {
    path: "attachments",
    select: "url type caption uploadedAt",
  },
};

const populateReviewFields = (query, populateOptions = {}) => {
  const {
    populateUser = true,
    populateTour = true,
    populateResponseUser = false,
    populateFlagUsers = false,
    populateEditHistory = false,
    populateAttachments = false,
    populateAll = false,
    customPopulations = [],
  } = populateOptions;

  let populatedQuery = query;

  if (populateAll) {
    return populatedQuery
      .populate(POPULATION_CONFIG.user)
      .populate(POPULATION_CONFIG.tour)
      .populate(POPULATION_CONFIG.responseUser)
      .populate(POPULATION_CONFIG.flagUsers)
      .populate(POPULATION_CONFIG.editHistory)
      .populate(POPULATION_CONFIG.attachments);
  }

  if (populateUser) {
    populatedQuery = populatedQuery.populate(POPULATION_CONFIG.user);
  }

  if (populateTour) {
    populatedQuery = populatedQuery.populate(POPULATION_CONFIG.tour);
  }

  if (populateResponseUser) {
    populatedQuery = populatedQuery.populate(POPULATION_CONFIG.responseUser);
  }

  if (populateFlagUsers) {
    populatedQuery = populatedQuery.populate(POPULATION_CONFIG.flagUsers);
  }

  if (populateEditHistory) {
    populatedQuery = populatedQuery.populate(POPULATION_CONFIG.editHistory);
  }

  if (populateAttachments) {
    populatedQuery = populatedQuery.populate(POPULATION_CONFIG.attachments);
  }

  for (const custom of customPopulations) {
    populatedQuery = populatedQuery.populate(custom);
  }

  return populatedQuery;
};

/* ============================================================
   DELETE FACTORY HANDLERS
   ============================================================ */

const deleteReview = deleteOne(Review, {
  modelName: "Review",
  softDelete: true,
  idParam: "id",
  beforeDelete: async (doc, req) => {
    const isOwner = doc.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isTourCreator = await Tour.exists({
      _id: doc.tour,
      createdBy: req.user._id,
    });

    if (!isOwner && !isAdmin && !isTourCreator) {
      throw new AppError("You are not authorized to delete this review", 403);
    }
  },
  afterDelete: async (doc) => {
    await Review.calcAverageRatings(doc.tour);
  },
});

const permanentDeleteReview = permanentDeleteOne(Review, {
  modelName: "Review",
  idParam: "id",
  beforePermanentDelete: (doc, req) => {
    if (req.user.role !== "admin") {
      throw new AppError("Only admins can permanently delete reviews", 403);
    }

    return doc;
  },
  afterPermanentDelete: async (doc) => {
    await Review.calcAverageRatings(doc.tour);
  },
});

const restoreReview = restoreOne(Review, {
  modelName: "Review",
  idParam: "id",
  beforeRestore: (doc, req) => {
    if (req.user.role !== "admin") {
      throw new AppError("Only admins can restore reviews", 403);
    }

    return doc;
  },
  afterRestore: async (doc) => {
    await Review.calcAverageRatings(doc.tour);
  },
});

const bulkDeleteReviews = deleteMany(Review, {
  modelName: "Review",
  softDelete: true,
  maxDeleteLimit: 50,
  beforeBulkDelete: (docs, req) => {
    if (req.user.role !== "admin") {
      throw new AppError("Only admins can bulk delete reviews", 403);
    }

    return docs;
  },
  afterBulkDelete: async (docs) => {
    const tourIds = [...new Set(docs.map((doc) => doc.tour.toString()))];

    await Promise.all(
      tourIds.map((tourId) => Review.calcAverageRatings(tourId)),
    );
  },
});

/* ============================================================
   CREATE FACTORY HANDLER
   ============================================================ */

const createReview = createOne(Review, {
  modelName: "Review",
  populateOptions: [
    { path: "user", select: "name email profileImage role bio" },
    {
      path: "tour",
      select:
        "name slug price duration difficulty imageCover ratingsAverage ratingsQuantity",
    },
  ],
  beforeCreate: async (data, req) => {
    const tourId = req.params.tourId || req.params.id || req.body.tourId;

    if (!data.review || !data.rating) {
      throw new AppError("Please provide review text and rating", 400);
    }

    if (!tourId) {
      throw new AppError("Tour ID is required", 400);
    }

    const tour = await Tour.findById(tourId);

    if (!tour) {
      throw new AppError("Tour not found", 404);
    }

    const alreadyReviewed = await Review.hasUserReviewedTour(
      req.user._id,
      tourId,
    );

    if (alreadyReviewed) {
      throw new AppError("You have already reviewed this tour", 400);
    }

    let isVerifiedPurchase = false;

    if (req.user.bookings && req.user.bookings.length > 0) {
      isVerifiedPurchase = req.user.bookings.some(
        (booking) => booking.tour.toString() === tourId.toString(),
      );
    }

    const isTourCreator = tour.createdBy.toString() === req.user._id.toString();
    const autoApprove =
      req.user.role === "admin" ||
      req.user.role === "lead-guide" ||
      isTourCreator;

    return {
      ...data,
      tour: tourId,
      user: req.user._id,
      title: data.title || "",
      isVerifiedPurchase,
      isRecommended:
        data.isRecommended !== undefined ? data.isRecommended : true,
      ...(autoApprove && { status: "approved" }),
      metadata: {
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip || req.connection.remoteAddress,
        device: req.device?.type || "other",
      },
    };
  },
});

/* ============================================================
   UPDATE FACTORY HANDLER (existing — admin/owner path)
   ============================================================ */

const updateReview = updateOne(Review, {
  modelName: "Review",
  populateOptions: [
    { path: "user", select: "name email profileImage role bio" },
    {
      path: "tour",
      select:
        "name slug price duration difficulty imageCover ratingsAverage ratingsQuantity",
    },
    { path: "editHistory.editedBy", select: "name email role" },
    { path: "response.respondedBy", select: "name email role profileImage" },
  ],

  checkOwnership: (doc, req) => {
    if (doc.user.toString() !== req.user._id.toString()) {
      throw new AppError("You are not authorized to update this review", 403);
    }

    if (doc.status === "rejected" || doc.status === "flagged") {
      throw new AppError("This review cannot be edited", 400);
    }
  },

  beforeUpdate: (data, existingDoc, req) => {
    const updateData = {};

    if (data.review !== undefined) updateData.review = data.review;
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.isRecommended !== undefined) {
      updateData.isRecommended = data.isRecommended;
    }

    const editHistory = existingDoc.editHistory || [];

    editHistory.push({
      review: existingDoc.review,
      rating: existingDoc.rating,
      editedAt: new Date(),
      editedBy: req.user._id,
    });

    updateData.editHistory = editHistory;

    if (existingDoc.status === "approved") {
      updateData.status = "pending";
    }

    return updateData;
  },
});

/* ============================================================
   READ FACTORY HANDLERS
   ============================================================ */

const getAllReviews = getAll(Review, {
  modelName: "Review",
  searchFields: ["review", "title"],
  allowedFilters: ["tour", "user", "status", "rating"],
  allowedSorts: [
    "createdAt",
    "rating",
    "helpfulCount",
    "isVerifiedPurchase",
    "isRecommended",
  ],
  defaultSort: { createdAt: -1 },
  defaultLimit: 10,
  maxLimit: 100,
  resourceKey: "reviews",

  transformFilter: (filter, req) => {
    const tourId = req.params.tourId || req.query.tourId;
    const { minRating, maxRating, status } = req.query;

    const newFilter = { ...filter };

    if (tourId) newFilter.tour = tourId;

    if (minRating || maxRating) {
      newFilter.rating = {};
      if (minRating) newFilter.rating.$gte = parseFloat(minRating);
      if (maxRating) newFilter.rating.$lte = parseFloat(maxRating);
    }

    const isAdmin = req.user?.role === "admin";

    if (!isAdmin) {
      newFilter.status = "approved";
    } else if (status && status !== "all") {
      newFilter.status = status;
    } else if (!status) {
      delete newFilter.status;
    }

    delete newFilter.minRating;
    delete newFilter.maxRating;

    return newFilter;
  },

  populateOptions: (req) => {
    const popOpts = [
      {
        path: "user",
        select: "name email profileImage role bio",
      },
      {
        path: "tour",
        select:
          "name slug price duration difficulty imageCover ratingsAverage ratingsQuantity",
      },
    ];

    if (req.user?.role === "admin") {
      popOpts.push({
        path: "flagReasons.flaggedBy",
        select: "name email role",
      });
      popOpts.push({
        path: "editHistory.editedBy",
        select: "name email role",
      });
    }

    return popOpts;
  },

  afterQuery: (docs, req) => {
    if (req.user?.role !== "admin") {
      return docs.map((doc) => {
        const copy = { ...doc };

        delete copy.flagReasons;
        delete copy.editHistory;

        return copy;
      });
    }

    return docs;
  },
});

const getReview = getOne(Review, {
  modelName: "Review",
  conditions: {},
  checkAccess: (doc, req) => {
    if (doc.status === "approved") return;

    if (!req.user) {
      throw new AppError("Review is not available", 404);
    }

    const isOwner = doc.user?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isTourCreator =
      doc.tour?.createdBy &&
      doc.tour.createdBy.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin && !isTourCreator) {
      throw new AppError("Review is not available", 404);
    }
  },
  populateOptions: (req) => {
    const popOpts = [
      { path: "user", select: "name email profileImage role bio" },
      {
        path: "tour",
        select:
          "name slug price duration difficulty imageCover ratingsAverage ratingsQuantity createdBy",
      },
      { path: "response.respondedBy", select: "name email role profileImage" },
      { path: "attachments", select: "url type caption uploadedAt" },
    ];

    if (req.user?.role === "admin") {
      popOpts.push({
        path: "flagReasons.flaggedBy",
        select: "name email role",
      });
      popOpts.push({
        path: "editHistory.editedBy",
        select: "name email role",
      });
    }

    return popOpts;
  },
});

/* ============================================================
   CUSTOM HANDLERS
   ============================================================ */

const markHelpful = catchAsync(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  if (review.status !== "approved") {
    throw new AppError("This review cannot be marked as helpful", 400);
  }

  await review.markHelpful();

  const populatedReview = await populateReviewFields(Review.findById(id), {
    populateUser: true,
    populateTour: true,
  }).lean();

  res.status(200).json({
    status: "success",
    message: "Review marked as helpful",
    data: {
      helpfulCount: review.helpfulCount,
      review: populatedReview,
    },
  });
});

const addReviewResponse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text) {
    throw new AppError("Please provide a response text", 400);
  }

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  const tour = await Tour.findById(review.tour);

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  const isTourCreator = tour.createdBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  const isGuide = tour.guides && tour.guides.includes(req.user._id);

  if (!isTourCreator && !isAdmin && !isGuide) {
    throw new AppError("You are not authorized to respond to this review", 403);
  }

  await review.addResponse(text, req.user._id);

  const populatedReview = await populateReviewFields(Review.findById(id), {
    populateUser: true,
    populateTour: true,
    populateResponseUser: true,
  }).lean();

  res.status(200).json({
    status: "success",
    message: "Response added successfully",
    data: { review: populatedReview },
  });
});

const approveReview = catchAsync(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  if (req.user.role !== "admin") {
    throw new AppError("You are not authorized to approve reviews", 403);
  }

  await review.approve();

  const populatedReview = await populateReviewFields(Review.findById(id), {
    populateUser: true,
    populateTour: true,
    populateResponseUser: true,
    populateFlagUsers: true,
  }).lean();

  res.status(200).json({
    status: "success",
    message: "Review approved successfully",
    data: { review: populatedReview },
  });
});

const rejectReview = catchAsync(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  if (req.user.role !== "admin") {
    throw new AppError("You are not authorized to reject reviews", 403);
  }

  await review.reject();

  res.status(200).json({
    status: "success",
    message: "Review rejected successfully",
  });
});

const flagReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason, description } = req.body;

  if (!reason) {
    throw new AppError("Please provide a reason for flagging", 400);
  }

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  const alreadyFlagged = review.flagReasons.some(
    (flag) => flag.flaggedBy.toString() === req.user._id.toString(),
  );

  if (alreadyFlagged) {
    throw new AppError("You have already flagged this review", 400);
  }

  await review.flagReview(reason, description || "", req.user._id);

  const populatedReview = await populateReviewFields(Review.findById(id), {
    populateUser: true,
    populateTour: true,
    populateFlagUsers: true,
  }).lean();

  res.status(200).json({
    status: "success",
    message: "Review flagged successfully",
    data: { review: populatedReview },
  });
});

const getReviewStats = catchAsync(async (req, res) => {
  const tourId = req.params.tourId || req.params.id || req.query.tourId;

  if (!tourId) {
    throw new AppError("Tour ID is required", 400);
  }

  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  const stats = await Review.getReviewStats(tourId);
  const distribution = await Review.getRatingDistribution(tourId);

  const recentReviews = await populateReviewFields(
    Review.find({
      tour: tourId,
      status: "approved",
    })
      .sort("-createdAt")
      .limit(3),
    {
      populateUser: true,
      populateTour: false,
    },
  ).lean();

  res.status(200).json({
    status: "success",
    data: {
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
      recentReviews,
    },
  });
});

const getTourReviews = catchAsync(async (req, res) => {
  const tourId = req.params.tourId || req.params.id || req.query.tourId;
  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    minRating,
    maxRating,
    helpful,
    populateUser = "true",
    populateAll = "false",
    userFields,
  } = req.query;

  if (!tourId) {
    throw new AppError("Tour ID is required", 400);
  }

  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  let query = Review.find({
    tour: tourId,
    status: "approved",
  });

  if (minRating) {
    query = query.where("rating").gte(parseFloat(minRating));
  }

  if (maxRating) {
    query = query.where("rating").lte(parseFloat(maxRating));
  }

  if (helpful === "true") {
    query = query.where("helpfulCount").gte(1);
  }

  const sortOptions = {
    "-createdAt": { createdAt: -1 },
    createdAt: { createdAt: 1 },
    "-rating": { rating: -1 },
    rating: { rating: 1 },
    "-helpfulCount": { helpfulCount: -1 },
    helpfulCount: { helpfulCount: 1 },
  };

  query = query.sort(sortOptions[sort] || { createdAt: -1 });

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  query = query.skip(skip).limit(limitNum);

  const parsedOptions = {
    populateAll,
    populateUser,
    populateTour: "false",
    populateResponseUser: "false",
    populateAttachments: "false",
    populateFlagUsers: "false",
    populateEditHistory: "false",
    userFields,
  };

  query = populateReviewFields(query, parsedOptions);

  const reviews = await query.lean();

  const total = await Review.countDocuments({
    tour: tourId,
    status: "approved",
  });

  res.status(200).json({
    status: "success",
    results: reviews.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: { reviews },
  });
});

const getMyReviews = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    status,
    populateAll = "false",
    populateTour = "true",
    populateResponseUser = "true",
    populateAttachments = "false",
    tourFields,
  } = req.query;

  let query = Review.find({ user: req.user._id });

  if (status) {
    query = query.where("status").equals(status);
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  query = query.sort(sort).skip(skip).limit(limitNum);

  const parsedOptions = {
    populateAll,
    populateUser: "false",
    populateTour,
    populateResponseUser,
    populateAttachments,
    populateFlagUsers: "false",
    populateEditHistory: "false",
    tourFields,
  };

  query = populateReviewFields(query, parsedOptions);

  const reviews = await query.lean();

  const total = await Review.countDocuments({ user: req.user._id });

  res.status(200).json({
    status: "success",
    results: reviews.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: { reviews },
  });
});

const getBatchTourReviews = catchAsync(async (req, res) => {
  const { tourIds } = req.body;
  const {
    limit = 5,
    sort = "-createdAt",
    populateUser = "true",
    userFields,
  } = req.query;

  if (!tourIds || !Array.isArray(tourIds) || tourIds.length === 0) {
    throw new AppError("Please provide an array of tour IDs", 400);
  }

  const tours = await Tour.find({ _id: { $in: tourIds } });

  if (tours.length !== tourIds.length) {
    throw new AppError("Some tours not found", 404);
  }

  const reviewsByTour = await Promise.all(
    tourIds.map(async (tourId) => {
      const query = Review.find({
        tour: tourId,
        status: "approved",
      })
        .sort(sort)
        .limit(parseInt(limit, 10));

      const parsedOptions = {
        populateAll: "false",
        populateUser,
        populateTour: "false",
        populateResponseUser: "false",
        populateAttachments: "false",
        populateFlagUsers: "false",
        populateEditHistory: "false",
        userFields,
      };

      const reviews = await populateReviewFields(query, parsedOptions).lean();

      return {
        tourId,
        count: reviews.length,
        reviews,
      };
    }),
  );

  res.status(200).json({
    status: "success",
    data: { reviewsByTour },
  });
});

/* ============================================================
   DUPLICATE-PREVENTION HELPERS — new custom handlers
   ============================================================ */

const getMyReviewForTour = catchAsync(async (req, res, next) => {
  const tourId = req.params.tourId || req.params.id;

  if (!tourId) {
    return next(new AppError("Tour ID is required", 400));
  }

  const review = await Review.getUserReviewForTourPopulated(
    req.user._id,
    tourId,
  );

  return res.status(200).json({
    status: "success",
    data: { review: review || null },
  });
});

const updateMyReview = catchAsync(async (req, res, next) => {
  const tourId = req.params.tourId || req.params.id;

  if (!tourId) {
    return next(new AppError("Tour ID is required", 400));
  }

  const review = await Review.findOne({
    user: req.user._id,
    tour: tourId,
  });

  if (!review) {
    return next(new AppError("You have not reviewed this tour yet", 404));
  }

  if (review.status === "rejected" || review.status === "flagged") {
    return next(new AppError("This review cannot be edited", 400));
  }

  const newReview = req.body.review ?? review.review;
  const newRating = req.body.rating ?? review.rating;

  if (newRating < 1 || newRating > 5) {
    return next(new AppError("Rating must be between 1 and 5", 400));
  }

  await review.editReview(newReview, newRating, req.user._id);

  const populatedReview = await populateReviewFields(
    Review.findById(review._id),
    {
      populateUser: true,
      populateTour: true,
    },
  ).lean();

  res.status(200).json({
    status: "success",
    message: "Review updated successfully",
    data: { review: populatedReview },
  });
});

/**
 * GET /reviews/me
 * Currently provided by getMyReviews above.
 * This is just an alias export name for clarity.
 */

/* ============================================================
   EXPORTS
   ============================================================ */

export {
  deleteReview,
  permanentDeleteReview,
  restoreReview,
  bulkDeleteReviews,
  createReview,
  getAllReviews,
  getReview,
  updateReview,
  markHelpful,
  addReviewResponse,
  approveReview,
  rejectReview,
  flagReview,
  getReviewStats,
  getTourReviews,
  getMyReviews,
  getBatchTourReviews,
  getMyReviewForTour,
  updateMyReview,
};
