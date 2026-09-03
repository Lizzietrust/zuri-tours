import Review from "../models/Review.js";
import Tour from "../models/Tour.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";

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

// const parsePopulationOptions = (query) => {
//   const {
//     populateUser = "true",
//     populateTour = "true",
//     populateResponseUser = "false",
//     populateFlagUsers = "false",
//     populateEditHistory = "false",
//     populateAttachments = "false",
//     populateAll = "false",
//     // Custom field selections
//     userFields = "name email profileImage role",
//     tourFields = "name slug price duration difficulty imageCover",
//     responseUserFields = "name email role profileImage",
//     flagUserFields = "name email role",
//     editHistoryFields = "name email role",
//   } = query;

//   return {
//     populateUser: populateUser === "true",
//     populateTour: populateTour === "true",
//     populateResponseUser: populateResponseUser === "true",
//     populateFlagUsers: populateFlagUsers === "true",
//     populateEditHistory: populateEditHistory === "true",
//     populateAttachments: populateAttachments === "true",
//     populateAll: populateAll === "true",
//     // Custom field selections
//     userFields,
//     tourFields,
//     responseUserFields,
//     flagUserFields,
//     editHistoryFields,
//   };
// };

const buildPopulationOptions = (parsedOptions, userRole = null) => {
  const options = {
    populateUser: parsedOptions.populateUser,
    populateTour: parsedOptions.populateTour,
    populateResponseUser: parsedOptions.populateResponseUser,
    populateAttachments: parsedOptions.populateAttachments,
    populateAll: parsedOptions.populateAll,
    customPopulations: [],
  };

  if (userRole === "admin") {
    options.populateFlagUsers = parsedOptions.populateFlagUsers || true;
    options.populateEditHistory = parsedOptions.populateEditHistory || true;
  } else {
    options.populateFlagUsers = false;
    options.populateEditHistory = false;
  }

  if (
    parsedOptions.userFields &&
    parsedOptions.userFields !== "name email profileImage role"
  ) {
    options.customPopulations.push({
      path: "user",
      select: parsedOptions.userFields,
    });
  }

  if (
    parsedOptions.tourFields &&
    parsedOptions.tourFields !==
      "name slug price duration difficulty imageCover"
  ) {
    options.customPopulations.push({
      path: "tour",
      select: parsedOptions.tourFields,
    });
  }

  if (
    parsedOptions.responseUserFields &&
    parsedOptions.responseUserFields !== "name email role profileImage"
  ) {
    options.customPopulations.push({
      path: "response.respondedBy",
      select: parsedOptions.responseUserFields,
    });
  }

  return options;
};

export const createReview = catchAsync(async (req, res) => {
  const { tourId } = req.params;
  const { review, rating, title, isRecommended } = req.body;

  if (!review || !rating) {
    throw new AppError("Please provide review text and rating", 400);
  }

  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  const existingReview = await Review.findOne({
    tour: tourId,
    user: req.user._id,
  });

  if (existingReview) {
    throw new AppError("You have already reviewed this tour", 400);
  }

  let isVerifiedPurchase = false;

  if (req.user.bookings && req.user.bookings.length > 0) {
    const hasBooking = req.user.bookings.some(
      (booking) => booking.tour.toString() === tourId.toString(),
    );

    if (hasBooking) {
      isVerifiedPurchase = true;
    }
  }

  const reviewData = {
    review,
    rating,
    title: title || "",
    tour: tourId,
    user: req.user._id,
    isVerifiedPurchase,
    isRecommended: isRecommended !== undefined ? isRecommended : true,

    metadata: {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip || req.connection.remoteAddress,
      device: req.device?.type || "other",
    },
  };

  const isTourCreator = tour.createdBy.toString() === req.user._id.toString();

  if (
    req.user.role === "admin" ||
    req.user.role === "lead-guide" ||
    isTourCreator
  ) {
    reviewData.status = "approved";
  }

  const newReview = await Review.create(reviewData);

  const populatedReview = await populateReviewFields(
    Review.findById(newReview._id),
    {
      populateUser: true,
      populateTour: true,
    },
  ).lean();

  res.status(201).json({
    status: "success",
    message: "Review created successfully",
    data: { review: populatedReview },
  });
});

export const getAllReviews = catchAsync(async (req, res) => {
  const { tourId } = req.params;
  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    status = "approved",
    minRating,
    maxRating,

    populateAll = "false",
    populateUser = "true",
    populateTour = "true",
    populateResponseUser = "false",
    populateAttachments = "false",

    userFields,
    tourFields,
    responseUserFields,
  } = req.query;

  let query = Review.find({ tour: tourId });

  if (status) {
    if (req.user && req.user.role === "admin") {
      if (status !== "all") {
        query = query.where("status").equals(status);
      }
    } else {
      query = query.where("status").equals("approved");
    }
  } else if (!req.user || req.user.role !== "admin") {
    query = query.where("status").equals("approved");
  }

  if (minRating) {
    query = query.where("rating").gte(parseFloat(minRating));
  }
  if (maxRating) {
    query = query.where("rating").lte(parseFloat(maxRating));
  }

  const sortOptions = {
    "-createdAt": { createdAt: -1 },
    createdAt: { createdAt: 1 },
    "-rating": { rating: -1 },
    rating: { rating: 1 },
    "-helpfulCount": { helpfulCount: -1 },
    helpfulCount: { helpfulCount: 1 },
    "-isVerifiedPurchase": { isVerifiedPurchase: -1 },
    isVerifiedPurchase: { isVerifiedPurchase: 1 },
    "-isRecommended": { isRecommended: -1 },
    isRecommended: { isRecommended: 1 },
  };

  query = query.sort(sortOptions[sort] || { createdAt: -1 });

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  query = query.skip(skip).limit(limitNum);

  const parsedOptions = {
    populateAll,
    populateUser,
    populateTour,
    populateResponseUser,
    populateAttachments,
    populateFlagUsers: "false",
    populateEditHistory: "false",
    userFields,
    tourFields,
    responseUserFields,
  };

  const popOptions = buildPopulationOptions(parsedOptions, req.user?.role);

  query = populateReviewFields(query, popOptions);

  const reviews = await query.lean();

  let countQuery = Review.find({ tour: tourId });

  if (!req.user || req.user.role !== "admin") {
    countQuery = countQuery.where("status").equals("approved");
  }
  const total = await countQuery.countDocuments();

  res.status(200).json({
    status: "success",
    results: reviews.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: { reviews },
  });
});

export const getReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    populateAll = "true",
    populateUser = "true",
    populateTour = "true",
    populateResponseUser = "true",
    populateAttachments = "true",
    userFields,
    tourFields,
    responseUserFields,
  } = req.query;

  let query = Review.findById(id);

  const parsedOptions = {
    populateAll,
    populateUser,
    populateTour,
    populateResponseUser,
    populateAttachments,
    populateFlagUsers: "true",
    populateEditHistory: "true",
    userFields,
    tourFields,
    responseUserFields,
  };

  const popOptions = buildPopulationOptions(parsedOptions, req.user?.role);

  query = populateReviewFields(query, popOptions);

  const review = await query.lean();

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  if (review.status !== "approved" && !req.user) {
    throw new AppError("Review is not available", 404);
  }

  if (review.status !== "approved" && req.user) {
    const isOwner = review.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isTourCreator =
      review.tour &&
      review.tour.createdBy &&
      review.tour.createdBy.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin && !isTourCreator) {
      throw new AppError("Review is not available", 404);
    }
  }

  res.status(200).json({
    status: "success",
    data: { review },
  });
});

export const updateReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { review, rating, title, isRecommended } = req.body;

  const existingReview = await Review.findById(id);

  if (!existingReview) {
    throw new AppError("Review not found", 404);
  }

  if (existingReview.user.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to update this review", 403);
  }

  if (
    existingReview.status === "rejected" ||
    existingReview.status === "flagged"
  ) {
    throw new AppError("This review cannot be edited", 400);
  }

  const updateData = {};

  if (review) updateData.review = review;
  if (rating) updateData.rating = rating;
  if (title !== undefined) updateData.title = title;
  if (isRecommended !== undefined) updateData.isRecommended = isRecommended;

  if (!existingReview.editHistory) {
    existingReview.editHistory = [];
  }
  existingReview.editHistory.push({
    review: existingReview.review,
    rating: existingReview.rating,
    editedAt: new Date(),
    editedBy: req.user._id,
  });

  if (existingReview.status === "approved") {
    updateData.status = "pending";
  }

  const updatedReview = await Review.findByIdAndUpdate(
    id,
    { ...updateData, editHistory: existingReview.editHistory },
    {
      new: true,
      runValidators: true,
    },
  );

  const populatedReview = await populateReviewFields(
    Review.findById(updatedReview._id),
    {
      populateUser: true,
      populateTour: true,
      populateEditHistory: true,
      populateResponseUser: true,
    },
  ).lean();

  res.status(200).json({
    status: "success",
    message: "Review updated successfully",
    data: { review: populatedReview },
  });
});

export const deleteReview = catchAsync(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  const isOwner = review.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  const isTourCreator = await Tour.exists({
    _id: review.tour,
    createdBy: req.user._id,
  });

  if (!isOwner && !isAdmin && !isTourCreator) {
    throw new AppError("You are not authorized to delete this review", 403);
  }

  if (req.query.hard === "true" && isAdmin) {
    await Review.findByIdAndDelete(id);
  } else {
    review.status = "rejected";
    await review.save();
  }

  await Review.calcAverageRatings(review.tour);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const markHelpful = catchAsync(async (req, res) => {
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

export const addReviewResponse = catchAsync(async (req, res) => {
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

export const approveReview = catchAsync(async (req, res) => {
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

export const rejectReview = catchAsync(async (req, res) => {
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

export const flagReview = catchAsync(async (req, res) => {
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

export const getReviewStats = catchAsync(async (req, res) => {
  const { tourId } = req.params;

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

// Get user's reviews
export const getMyReviews = catchAsync(async (req, res) => {
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

  // Parse and apply population options
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

  const popOptions = buildPopulationOptions(parsedOptions, req.user?.role);

  query = populateReviewFields(query, popOptions);

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

// ==================== GET REVIEWS BY TOUR (PUBLIC) ====================

export const getTourReviews = catchAsync(async (req, res) => {
  const { tourId } = req.params;
  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    minRating,
    maxRating,
    helpful,
    // Population options
    populateUser = "true",
    populateAll = "false",
    userFields,
  } = req.query;

  // Check if tour exists
  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  // Build query
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

  // Apply population
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

  const popOptions = buildPopulationOptions(parsedOptions);

  query = populateReviewFields(query, popOptions);

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

// ==================== BULK REVIEW OPERATIONS ====================

// Get reviews for multiple tours (batch)
export const getBatchTourReviews = catchAsync(async (req, res) => {
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

  // Validate tours exist
  const tours = await Tour.find({ _id: { $in: tourIds } });

  if (tours.length !== tourIds.length) {
    throw new AppError("Some tours not found", 404);
  }

  // Get reviews for all tours
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

      const popOptions = buildPopulationOptions(parsedOptions);
      const reviews = await populateReviewFields(query, popOptions).lean();

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
