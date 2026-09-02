import Review from "../models/Review.js";
import Tour from "../models/Tour.js";
// import User from "../models/User.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";

const populateReviewFields = (query, populateOptions = {}) => {
  const {
    populateUser = true,
    populateTour = true,
    populateResponseUser = false,
    populateFlagUsers = false,
    populateEditHistory = false,
    populateAll = false,
  } = populateOptions;

  let populatedQuery = query;

  if (populateAll) {
    return populatedQuery
      .populate({
        path: "user",
        select: "name email profileImage role",
      })
      .populate({
        path: "tour",
        select: "name slug price duration difficulty imageCover",
      })
      .populate({
        path: "response.respondedBy",
        select: "name email role profileImage",
      })
      .populate({
        path: "flagReasons.flaggedBy",
        select: "name email role",
      })
      .populate({
        path: "editHistory.editedBy",
        select: "name email role",
      });
  }

  if (populateUser) {
    populatedQuery = populatedQuery.populate({
      path: "user",
      select: "name email profileImage role",
    });
  }

  if (populateTour) {
    populatedQuery = populatedQuery.populate({
      path: "tour",
      select: "name slug price duration difficulty imageCover",
    });
  }

  if (populateResponseUser) {
    populatedQuery = populatedQuery.populate({
      path: "response.respondedBy",
      select: "name email role profileImage",
    });
  }

  if (populateFlagUsers) {
    populatedQuery = populatedQuery.populate({
      path: "flagReasons.flaggedBy",
      select: "name email role",
    });
  }

  if (populateEditHistory) {
    populatedQuery = populatedQuery.populate({
      path: "editHistory.editedBy",
      select: "name email role",
    });
  }

  return populatedQuery;
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
  };

  if (req.user.role === "admin" || req.user.role === "lead-guide") {
    reviewData.status = "approved";
  }

  const newReview = await Review.create(reviewData);

  const populatedReview = await Review.findById(newReview._id)
    .populate({
      path: "user",
      select: "name email profileImage",
    })
    .populate({
      path: "tour",
      select: "name slug price duration difficulty imageCover",
    })
    .lean();

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
    populateUser = true,
    populateTour = true,
    populateAll = false,
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
  };

  query = query.sort(sortOptions[sort] || { createdAt: -1 });

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  query = query.skip(skip).limit(limitNum);

  const populateOptions = {
    populateUser: populateUser === "true",
    populateTour: populateTour === "true",
    populateAll: populateAll === "true",
  };

  query = populateReviewFields(query, populateOptions);

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
  const { populateAll = "true" } = req.query;

  let query = Review.findById(id);

  const populateOptions = {
    populateUser: true,
    populateTour: true,
    populateResponseUser: true,
    populateFlagUsers: req.user && req.user.role === "admin",
    populateEditHistory: req.user && req.user.role === "admin",
    populateAll: populateAll === "true",
  };

  query = populateReviewFields(query, populateOptions);

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

  const populatedReview = await Review.findById(updatedReview._id)
    .populate({
      path: "user",
      select: "name email profileImage",
    })
    .populate({
      path: "tour",
      select: "name slug price duration difficulty imageCover",
    })
    .populate({
      path: "editHistory.editedBy",
      select: "name email",
    })
    .lean();

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

  // Recalculate tour ratings
  await Review.calcAverageRatings(review.tour);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// ==================== REVIEW ACTIONS ====================

// Mark review as helpful
export const markHelpful = catchAsync(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  // Can only mark approved reviews as helpful
  if (review.status !== "approved") {
    throw new AppError("This review cannot be marked as helpful", 400);
  }

  // Check if user already marked this review as helpful
  // You might want to implement this with a separate collection
  // For now, we'll just increment the count

  await review.markHelpful();

  res.status(200).json({
    status: "success",
    message: "Review marked as helpful",
    data: {
      helpfulCount: review.helpfulCount,
    },
  });
});

// Add response to review
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

  // Check if user is authorized to respond
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

  // Populate the response user
  const populatedReview = await Review.findById(id)
    .populate({
      path: "response.respondedBy",
      select: "name email role profileImage",
    })
    .lean();

  res.status(200).json({
    status: "success",
    message: "Response added successfully",
    data: { review: populatedReview },
  });
});

// ==================== ADMIN REVIEW MANAGEMENT ====================

// Approve review (admin only)
export const approveReview = catchAsync(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  // Only admins can approve reviews
  if (req.user.role !== "admin") {
    throw new AppError("You are not authorized to approve reviews", 403);
  }

  await review.approve();

  const populatedReview = await Review.findById(id)
    .populate({
      path: "user",
      select: "name email profileImage",
    })
    .populate({
      path: "tour",
      select: "name slug price duration",
    })
    .lean();

  res.status(200).json({
    status: "success",
    message: "Review approved successfully",
    data: { review: populatedReview },
  });
});

// Reject review (admin only)
export const rejectReview = catchAsync(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  // Only admins can reject reviews
  if (req.user.role !== "admin") {
    throw new AppError("You are not authorized to reject reviews", 403);
  }

  await review.reject();

  res.status(200).json({
    status: "success",
    message: "Review rejected successfully",
  });
});

// Flag review
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

  // Check if user already flagged this review
  const alreadyFlagged = review.flagReasons.some(
    (flag) => flag.flaggedBy.toString() === req.user._id.toString(),
  );

  if (alreadyFlagged) {
    throw new AppError("You have already flagged this review", 400);
  }

  await review.flagReview(reason, description || "", req.user._id);

  res.status(200).json({
    status: "success",
    message: "Review flagged successfully",
  });
});

// ==================== REVIEW STATISTICS ====================

// Get review statistics for a tour
export const getReviewStats = catchAsync(async (req, res) => {
  const { tourId } = req.params;

  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError("Tour not found", 404);
  }

  const stats = await Review.getReviewStats(tourId);
  const distribution = await Review.getRatingDistribution(tourId);

  // Get recent reviews
  const recentReviews = await Review.find({
    tour: tourId,
    status: "approved",
  })
    .sort("-createdAt")
    .limit(3)
    .populate({
      path: "user",
      select: "name email profileImage",
    })
    .lean();

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
  const { page = 1, limit = 10, sort = "-createdAt", status } = req.query;

  let query = Review.find({ user: req.user._id });

  if (status) {
    query = query.where("status").equals(status);
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  query = query.sort(sort).skip(skip).limit(limitNum);

  const reviews = await query
    .populate({
      path: "tour",
      select: "name slug price duration difficulty imageCover",
    })
    .populate({
      path: "response.respondedBy",
      select: "name email",
    })
    .lean();

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

  const reviews = await query
    .populate({
      path: "user",
      select: "name email profileImage",
    })
    .lean();

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
