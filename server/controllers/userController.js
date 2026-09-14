import User from "../models/User.js";
import Tour from "../models/Tour.js";
import Review from "../models/Review.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  sendSuccessResponse,
  sendNotFoundResponse,
  sendValidationErrorResponse,
} from "../utils/responseHelper.js";
import { AppError } from "../utils/appError.js";
import {
  deleteOne,
  deleteMany,
  restoreOne,
  permanentDeleteOne,
  createOne,
  updateOne,
  updateMany,
  getAll,
  getOne,
} from "../utils/handlerFactory.js";

/* ============================================================
   SHARED SELECTS / CONSTANTS
   ============================================================ */

const SENSITIVE_FIELDS = [
  "password",
  "passwordConfirm",
  "passwordChangedAt",
  "resetPasswordToken",
  "resetPasswordExpire",
  "loginAttempts",
  "lockUntil",
  "tokenVersion",
  "accountDeleted",
  "accountDeletedAt",
  "_id",
  "createdAt",
  "updatedAt",
  "__v",
];

const SAFE_USER_SELECT =
  "-password -passwordChangedAt -resetPasswordToken -resetPasswordExpire -loginAttempts -lockUntil -tokenVersion -accountDeleted -accountDeletedAt";

/* ============================================================
   DELETE FACTORY HANDLERS
   ============================================================ */

const deleteUser = deleteOne(User, {
  modelName: "User",
  softDelete: true,
  idParam: "id",
  conditions: { accountDeleted: false },
  beforeDelete: async (doc, req) => {
    if (doc._id.toString() === req.user._id.toString()) {
      throw new AppError("You cannot delete your own account", 403);
    }

    if (doc.role === "admin" && req.user.role !== "admin") {
      throw new AppError("Cannot delete admin users", 403);
    }

    if (doc.assignedTours && doc.assignedTours.length > 0) {
      await Tour.updateMany(
        { _id: { $in: doc.assignedTours } },
        { $pull: { guides: doc._id } },
      );
    }
  },
  afterDelete: (doc) => {
    console.log(`User ${doc.email} soft deleted`);
  },
});

const permanentDeleteUser = permanentDeleteOne(User, {
  modelName: "User",
  idParam: "id",
  beforePermanentDelete: (doc, req) => {
    if (req.user.role !== "admin") {
      throw new AppError("Only admins can permanently delete users", 403);
    }

    if (doc.role === "admin") {
      throw new AppError("Cannot delete admin users", 403);
    }

    return doc;
  },
});

const restoreUser = restoreOne(User, {
  modelName: "User",
  idParam: "id",
  beforeRestore: (doc, req) => {
    if (req.user.role !== "admin") {
      throw new AppError("Only admins can restore users", 403);
    }

    return doc;
  },
});

const bulkDeleteUsers = deleteMany(User, {
  modelName: "User",
  softDelete: true,
  maxDeleteLimit: 50,
  conditions: { accountDeleted: false },
  beforeBulkDelete: async (docs, req) => {
    if (req.user.role !== "admin") {
      throw new AppError("Only admins can bulk delete users", 403);
    }

    const adminUsers = docs.filter((doc) => doc.role === "admin");

    if (adminUsers.length > 0) {
      throw new AppError("Cannot delete admin users", 403);
    }

    const userIds = docs.map((doc) => doc._id);

    await Tour.updateMany(
      { guides: { $in: userIds } },
      { $pull: { guides: { $in: userIds } } },
    );
  },
});

/* ============================================================
   CREATE FACTORY HANDLER
   ============================================================ */

const createUser = createOne(User, {
  modelName: "User",
  blockedFields: [
    "accountDeleted",
    "accountDeletedAt",
    "tokenVersion",
    "loginAttempts",
    "lockUntil",
    "passwordChangedAt",
    "resetPasswordToken",
    "resetPasswordExpire",
  ],

  transformData: (data) => {
    if (data.password && !data.passwordConfirm) {
      data.passwordConfirm = data.password;
    }

    return data;
  },

  beforeCreate: async (data) => {
    const existingUser = await User.findOne({ email: data.email });

    if (existingUser) {
      throw new AppError("Email already registered", 400);
    }

    return {
      ...data,
      role: data.role || "user",
    };
  },

  populateOptions: null,
});

const updateUser = updateOne(User, {
  modelName: "User",
  idParam: "id",
  conditions: { accountDeleted: false },
  blockedFields: SENSITIVE_FIELDS,
  select: SAFE_USER_SELECT,

  beforeUpdate: (data) => {
    if (data.password) {
      throw new AppError(
        "Use the password reset route to update password",
        400,
      );
    }

    return data;
  },
});

const updateUserRole = updateOne(User, {
  modelName: "User",
  idParam: "id",
  allowedFields: ["role"],
  select: SAFE_USER_SELECT,

  beforeUpdate: (data) => {
    if (!data.role) {
      throw new AppError("Please provide a role", 400);
    }

    const validRoles = ["user", "guide", "lead-guide", "admin"];

    if (!validRoles.includes(data.role)) {
      throw new AppError(
        `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        400,
      );
    }

    return data;
  },
});

const bulkUpdateUsers = updateMany(User, {
  modelName: "User",
  idsField: "userIds",
  maxUpdateLimit: 100,
  conditions: { accountDeleted: false },
  blockedFields: [...SENSITIVE_FIELDS, "role", "email"],

  checkAuthorization: (_docs, req) => {
    if (req.user.role !== "admin") {
      throw new AppError("Only admins can bulk update users", 403);
    }
  },
});

const getAllUsers = getAll(User, {
  modelName: "User",
  conditions: { accountDeleted: false },
  searchFields: ["name", "email"],
  allowedFilters: ["role"],
  allowedSorts: ["createdAt", "name", "email"],
  defaultSort: { createdAt: -1 },
  defaultLimit: 20,
  maxLimit: 100,
  defaultSelect: SAFE_USER_SELECT,
  resourceKey: "users",
});

const getUser = getOne(User, {
  modelName: "User",
  conditions: { accountDeleted: false },
  select: SAFE_USER_SELECT,
  populateOptions: [
    {
      path: "assignedTours",
      select: "name slug price duration difficulty ratingsAverage imageCover",
      populate: { path: "guides", select: "name email profileImage" },
    },
    {
      path: "bookings.tour",
      select: "name slug price duration difficulty imageCover",
    },
  ],
});

const getUsersByRole = getAll(User, {
  modelName: "User",
  conditions: { accountDeleted: false },
  defaultSelect: SAFE_USER_SELECT,
  defaultSort: { createdAt: -1 },
  defaultLimit: 20,
  maxLimit: 100,
  resourceKey: "users",

  transformFilter: (filter, req) => {
    const validRoles = ["user", "guide", "lead-guide", "admin"];
    const role = req.params.role || filter.role;

    if (!validRoles.includes(role)) {
      throw new AppError(
        `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        400,
      );
    }

    return { ...filter, role };
  },
});

const getUserTours = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    includeBookings = "false",
  } = req.query;

  const isSelf = req.user._id.toString() === userId;
  const isAdmin = req.user.role === "admin";

  if (!isSelf && !isAdmin) {
    return sendValidationErrorResponse(
      res,
      "You don't have permission to view this user's tours",
    );
  }

  const user = await User.findOne({
    _id: userId,
    accountDeleted: false,
  }).select("name email role assignedTours bookings");

  if (!user) {
    return sendNotFoundResponse(res, "User not found");
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const assignedToursQuery = Tour.find({
    _id: { $in: user.assignedTours || [] },
    isActive: true,
  })
    .select(
      "name slug price duration difficulty ratingsAverage imageCover summary startDates",
    )
    .populate({
      path: "guides",
      select: "name email profileImage",
    })
    .populate({
      path: "reviews",
      options: { limit: 3, sort: "-createdAt" },
      populate: {
        path: "user",
        select: "name email profileImage",
      },
    })
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const assignedTours = await assignedToursQuery.lean();

  const totalAssigned = await Tour.countDocuments({
    _id: { $in: user.assignedTours || [] },
    isActive: true,
  });

  let bookings = [];

  if (includeBookings === "true" && user.bookings && user.bookings.length > 0) {
    const bookingIds = user.bookings.map((b) => b._id || b);

    bookings = await Tour.find({
      _id: { $in: bookingIds },
      isActive: true,
    })
      .select("name slug price duration difficulty imageCover startDates")
      .lean();
  }

  sendSuccessResponse(res, 200, "User tours fetched successfully", {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    assignedTours: {
      data: assignedTours,
      total: totalAssigned,
      page: pageNum,
      pages: Math.ceil(totalAssigned / limitNum),
      limit: limitNum,
    },
    ...(includeBookings === "true" && { bookings }),
  });
});

const getUserReviews = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    status = "approved",
    minRating,
    maxRating,
  } = req.query;

  const isSelf = req.user._id.toString() === userId;
  const isAdmin = req.user.role === "admin";

  if (!isSelf && !isAdmin) {
    return sendValidationErrorResponse(
      res,
      "You don't have permission to view this user's reviews",
    );
  }

  const user = await User.findOne({
    _id: userId,
    accountDeleted: false,
  });

  if (!user) {
    return sendNotFoundResponse(res, "User not found");
  }

  let query = Review.find({ user: userId });

  if (!isAdmin) {
    query = query.where("status").equals("approved");
  } else if (status) {
    query = query.where("status").equals(status);
  }

  if (minRating) {
    query = query.where("rating").gte(parseFloat(minRating));
  }
  if (maxRating) {
    query = query.where("rating").lte(parseFloat(maxRating));
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  query = query
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .populate({
      path: "tour",
      select: "name slug price duration difficulty imageCover ratingsAverage",
    })
    .populate({
      path: "user",
      select: "name email profileImage",
    })
    .populate({
      path: "response.respondedBy",
      select: "name email role",
    });

  const reviews = await query.lean();

  const countQuery = Review.find({
    user: userId,
    ...(!isAdmin ? { status: "approved" } : {}),
    ...(minRating ? { rating: { $gte: parseFloat(minRating) } } : {}),
    ...(maxRating ? { rating: { $lte: parseFloat(maxRating) } } : {}),
  });

  const total = await countQuery.countDocuments();

  const stats = await Review.aggregate([
    {
      $match: {
        user: user._id,
        status: "approved",
      },
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
        minRating: { $min: "$rating" },
        maxRating: { $max: "$rating" },
        totalHelpful: { $sum: "$helpfulCount" },
        verifiedCount: { $sum: { $cond: ["$isVerifiedPurchase", 1, 0] } },
        recommendedCount: { $sum: { $cond: ["$isRecommended", 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        totalReviews: 1,
        averageRating: { $round: ["$averageRating", 1] },
        minRating: 1,
        maxRating: 1,
        totalHelpful: 1,
        verifiedCount: 1,
        recommendedCount: 1,
        recommendationRate: {
          $cond: [
            { $eq: ["$totalReviews", 0] },
            0,
            {
              $multiply: [
                { $divide: ["$recommendedCount", "$totalReviews"] },
                100,
              ],
            },
          ],
        },
      },
    },
  ]);

  const distribution = await Review.aggregate([
    {
      $match: {
        user: user._id,
        status: "approved",
      },
    },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: -1 },
    },
  ]);

  sendSuccessResponse(res, 200, "User reviews fetched successfully", {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
    },
    reviews: {
      data: reviews,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum,
    },
    stats: stats[0] || {
      totalReviews: 0,
      averageRating: 0,
      minRating: 0,
      maxRating: 0,
      totalHelpful: 0,
      verifiedCount: 0,
      recommendedCount: 0,
      recommendationRate: 0,
    },
    ratingDistribution: distribution,
  });
});

const getUserStats = catchAsync(async (req, res) => {
  const { id } = req.params;

  const isSelf = req.user._id.toString() === id;
  const isAdmin = req.user.role === "admin";

  if (!isSelf && !isAdmin) {
    return sendValidationErrorResponse(
      res,
      "You don't have permission to view this user's stats",
    );
  }

  const user = await User.findOne({
    _id: id,
    accountDeleted: false,
  });

  if (!user) {
    return sendNotFoundResponse(res, "User not found");
  }

  const tourStats = await Tour.aggregate([
    {
      $match: {
        _id: { $in: user.assignedTours || [] },
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,
        totalTours: { $sum: 1 },
        averagePrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        averageDuration: { $avg: "$duration" },
        totalRatings: { $sum: "$ratingsQuantity" },
        averageRating: { $avg: "$ratingsAverage" },
      },
    },
  ]);

  const reviewStats = await Review.aggregate([
    {
      $match: {
        user: user._id,
        status: "approved",
      },
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
        minRating: { $min: "$rating" },
        maxRating: { $max: "$rating" },
        totalHelpful: { $sum: "$helpfulCount" },
        verifiedCount: { $sum: { $cond: ["$isVerifiedPurchase", 1, 0] } },
      },
    },
  ]);

  const difficultyDistribution = await Tour.aggregate([
    {
      $match: {
        _id: { $in: user.assignedTours || [] },
        isActive: true,
      },
    },
    {
      $group: {
        _id: "$difficulty",
        count: { $sum: 1 },
      },
    },
  ]);

  const categoryDistribution = await Tour.aggregate([
    {
      $match: {
        _id: { $in: user.assignedTours || [] },
        isActive: true,
      },
    },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
  ]);

  const recentActivity = {
    recentReviews: await Review.find({
      user: user._id,
      status: "approved",
    })
      .sort("-createdAt")
      .limit(5)
      .populate({
        path: "tour",
        select: "name slug",
      })
      .select("review rating createdAt tour")
      .lean(),

    assignedTours: await Tour.find({
      _id: { $in: user.assignedTours || [] },
      isActive: true,
    })
      .sort("-createdAt")
      .limit(5)
      .select("name slug price duration difficulty imageCover")
      .lean(),
  };

  sendSuccessResponse(res, 200, "User statistics fetched successfully", {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    tourStats: tourStats[0] || {
      totalTours: 0,
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0,
      averageDuration: 0,
      totalRatings: 0,
      averageRating: 0,
    },
    reviewStats: reviewStats[0] || {
      totalReviews: 0,
      averageRating: 0,
      minRating: 0,
      maxRating: 0,
      totalHelpful: 0,
      verifiedCount: 0,
    },
    distributions: {
      difficulty: difficultyDistribution,
      category: categoryDistribution,
    },
    recentActivity,
  });
});

const getUsersWithStats = catchAsync(async (req, res) => {
  const users = await User.aggregate([
    {
      $match: { accountDeleted: false },
    },
    {
      $lookup: {
        from: "tours",
        localField: "assignedTours",
        foreignField: "_id",
        as: "assignedTours",
      },
    },
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "user",
        as: "reviews",
      },
    },
    {
      $addFields: {
        totalAssignedTours: { $size: "$assignedTours" },
        totalReviews: { $size: "$reviews" },
        averageReviewRating: {
          $cond: [
            { $eq: [{ $size: "$reviews" }, 0] },
            0,
            { $avg: "$reviews.rating" },
          ],
        },
        totalHelpfulCount: {
          $sum: "$reviews.helpfulCount",
        },
        verifiedReviewCount: {
          $size: {
            $filter: {
              input: "$reviews",
              as: "review",
              cond: { $eq: ["$$review.isVerifiedPurchase", true] },
            },
          },
        },
      },
    },
    {
      $project: {
        password: 0,
        __v: 0,
        reviews: 0,
        passwordChangedAt: 0,
        resetPasswordToken: 0,
        resetPasswordExpire: 0,
        loginAttempts: 0,
        lockUntil: 0,
        tokenVersion: 0,
        accountDeleted: 0,
        accountDeletedAt: 0,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  sendSuccessResponse(
    res,
    200,
    "Users with stats fetched successfully",
    users,
    {
      results: users.length,
    },
  );
});

const searchUsers = catchAsync(async (req, res) => {
  const { q, role, limit = 20, page = 1 } = req.query;

  if (!q) {
    return sendValidationErrorResponse(res, "Please provide a search query");
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const searchQuery = {
    accountDeleted: false,
    $or: [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ],
  };

  if (role) {
    const validRoles = ["user", "guide", "lead-guide", "admin"];

    if (!validRoles.includes(role)) {
      return sendValidationErrorResponse(
        res,
        `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      );
    }

    searchQuery.role = role;
  }

  const users = await User.find(searchQuery)
    .select(SAFE_USER_SELECT)
    .skip(skip)
    .limit(limitNum)
    .sort({ name: 1 });

  const total = await User.countDocuments(searchQuery);

  sendSuccessResponse(res, 200, "Users search completed", users, {
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    limit: limitNum,
  });
});

/* ============================================================
   /me ENDPOINTS (current authenticated user)
   ============================================================ */

/**
 * Fields a user is allowed to update on their own profile.
 * Sensitive fields (password, role, email, tokens, etc.) are
 * explicitly excluded.
 */
const ALLOWED_ME_UPDATE_FIELDS = [
  "name",
  "photo",
  "profileImage",
  "bio",
  "phone",
  "dateOfBirth",
  "address",
  "preferences",
  "languages",
  "expertise",
];

/**
 * GET /users/me
 * Returns the currently authenticated user's profile.
 */
const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .select(SAFE_USER_SELECT)
    .populate({
      path: "assignedTours",
      select: "name slug price duration difficulty ratingsAverage imageCover",
    })
    .populate({
      path: "bookings.tour",
      select: "name slug price duration difficulty imageCover startDates",
    })
    .lean();

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  return sendSuccessResponse(res, 200, "Current user fetched successfully", {
    user,
  });
});

const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400,
      ),
    );
  }

  if (req.body.role) {
    return next(new AppError("You cannot change your own role", 403));
  }

  const filteredBody = {};

  Object.keys(req.body).forEach((key) => {
    if (ALLOWED_ME_UPDATE_FIELDS.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  if (Object.keys(filteredBody).length === 0) {
    return next(
      new AppError(
        `No valid fields provided. Allowed fields: ${ALLOWED_ME_UPDATE_FIELDS.join(
          ", ",
        )}`,
        400,
      ),
    );
  }

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  }).select(SAFE_USER_SELECT);

  if (!updatedUser) {
    return next(new AppError("User not found", 404));
  }

  return sendSuccessResponse(res, 200, "Profile updated successfully", {
    user: updatedUser,
  });
});

const deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  user.accountDeleted = true;
  user.accountDeletedAt = new Date();
  user.isDeleted = true;
  user.deletedAt = new Date();
  user.deletedBy = req.user._id;

  await user.save({ validateBeforeSave: false });

  if (user.assignedTours && user.assignedTours.length > 0) {
    await Tour.updateMany(
      { _id: { $in: user.assignedTours } },
      { $pull: { guides: user._id } },
    );
  }

  return sendSuccessResponse(
    res,
    200,
    "Account deleted successfully. We're sorry to see you go!",
    null,
  );
});

/**
 * PATCH /users/me/password
 * Updates the current user's password with current password verification.
 */
const updateMyPassword = catchAsync(async (req, res, next) => {
  const { currentPassword, password, passwordConfirm } = req.body;

  if (!currentPassword || !password || !passwordConfirm) {
    return next(
      new AppError(
        "Please provide currentPassword, password, and passwordConfirm",
        400,
      ),
    );
  }

  if (password !== passwordConfirm) {
    return next(new AppError("Passwords do not match", 400));
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const isCorrect = await user.correctPassword(currentPassword, user.password);

  if (!isCorrect) {
    return next(new AppError("Your current password is incorrect", 401));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;

  if (typeof user.tokenVersion === "number") {
    user.tokenVersion += 1;
  }

  await user.save();

  return sendSuccessResponse(
    res,
    200,
    "Password updated successfully. Please log in again.",
    null,
  );
});

export {
  deleteUser,
  permanentDeleteUser,
  restoreUser,
  bulkDeleteUsers,
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  updateUserRole,
  getUsersByRole,
  getUserTours,
  getUserReviews,
  getUserStats,
  getUsersWithStats,
  searchUsers,
  bulkUpdateUsers,
  getMe,
  updateMe,
  deleteMe,
  updateMyPassword,
};
