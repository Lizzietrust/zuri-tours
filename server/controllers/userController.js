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
   SHARED SELECTS / CONSTANTS / HELPERS
   ============================================================ */

const VALID_ROLES = ["user", "guide", "lead-guide", "admin"];

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

const TOUR_SORTS = [
  "createdAt",
  "-createdAt",
  "price",
  "-price",
  "ratingsAverage",
  "-ratingsAverage",
  "name",
  "-name",
];

const REVIEW_SORTS = ["createdAt", "-createdAt", "rating", "-rating"];

const parsePagination = (query, { defaultLimit = 10, maxLimit = 100 } = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || defaultLimit, 1),
    maxLimit,
  );

  return { page, limit, skip: (page - 1) * limit };
};

const pickSort = (value, allowed, fallback = "-createdAt") =>
  allowed.includes(value) ? value : fallback;

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const assertSelfOrAdmin = (req, targetId, what) => {
  const isSelf = req.user._id.toString() === targetId;
  const isAdmin = req.user.role === "admin";

  if (!isSelf && !isAdmin) {
    throw new AppError(
      `You don't have permission to view this user's ${what}`,
      403,
    );
  }

  return { isSelf, isAdmin };
};

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
   CREATE / UPDATE FACTORY HANDLERS
   ============================================================ */

const createUser = createOne(User, {
  modelName: "User",
  blockedFields: [
    "accountDeleted",
    "accountDeletedAt",
    "isDeleted",
    "deletedAt",
    "deletedBy",
    "tokenVersion",
    "loginAttempts",
    "lockUntil",
    "lastLogin",
    "active",
    "activeSessions",
    "passwordChangedAt",
    "resetPasswordToken",
    "resetPasswordExpire",
    "assignedTours",
    "rating",
    "totalReviews",
    "salary",
    "hireDate",
    "performanceMetrics",
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

  blockedFields: [...SENSITIVE_FIELDS, "role"],
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
  conditions: { accountDeleted: false },
  allowedFields: ["role"],
  select: SAFE_USER_SELECT,

  beforeUpdate: (data) => {
    if (!data.role) {
      throw new AppError("Please provide a role", 400);
    }

    if (!VALID_ROLES.includes(data.role)) {
      throw new AppError(
        `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`,
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

/* ============================================================
   READ FACTORY HANDLERS
   ============================================================ */

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
      populate: { path: "guides", select: "name email photo" },
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
    const role = req.params.role || filter.role;

    if (!VALID_ROLES.includes(role)) {
      throw new AppError(
        `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`,
        400,
      );
    }

    return { ...filter, role };
  },
});

/* ============================================================
   PER-USER ENDPOINTS  (routes use :id)
   ============================================================ */

const getUserTours = catchAsync(async (req, res) => {
  const { id } = req.params;

  assertSelfOrAdmin(req, id, "tours");

  const user = await User.findOne({
    _id: id,
    accountDeleted: false,
  }).select("name email role assignedTours");

  if (!user) {
    return sendNotFoundResponse(res, "User not found");
  }

  const { page, limit, skip } = parsePagination(req.query);
  const sort = pickSort(req.query.sort, TOUR_SORTS);

  const tourFilter = {
    _id: { $in: user.assignedTours || [] },
    isActive: true,
  };

  const [assignedTours, totalAssigned] = await Promise.all([
    Tour.find(tourFilter)
      .select(
        "name slug price duration difficulty ratingsAverage imageCover summary startDates",
      )
      .populate({
        path: "guides",
        select: "name email photo",
      })
      .populate({
        path: "reviews",
        options: { perDocumentLimit: 3, sort: "-createdAt" },
        populate: {
          path: "user",
          select: "name email photo",
        },
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Tour.countDocuments(tourFilter),
  ]);

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
      page,
      pages: Math.ceil(totalAssigned / limit),
      limit,
    },
  });
});

const getUserReviews = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status = "approved", minRating, maxRating } = req.query;

  const { isAdmin } = assertSelfOrAdmin(req, id, "reviews");

  const user = await User.findOne({
    _id: id,
    accountDeleted: false,
  });

  if (!user) {
    return sendNotFoundResponse(res, "User not found");
  }

  const { page, limit, skip } = parsePagination(req.query);
  const sort = pickSort(req.query.sort, REVIEW_SORTS);

  const filter = { user: user._id };

  if (!isAdmin) {
    filter.status = "approved";
  } else if (status) {
    filter.status = String(status);
  }

  const min = parseFloat(minRating);
  const max = parseFloat(maxRating);

  if (!Number.isNaN(min) || !Number.isNaN(max)) {
    filter.rating = {};
    if (!Number.isNaN(min)) filter.rating.$gte = min;
    if (!Number.isNaN(max)) filter.rating.$lte = max;
  }

  const [reviews, total, stats, distribution] = await Promise.all([
    Review.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({
        path: "tour",
        select: "name slug price duration difficulty imageCover ratingsAverage",
      })
      .populate({
        path: "user",
        select: "name email photo",
      })
      .populate({
        path: "response.respondedBy",
        select: "name email role",
      })
      .lean(),

    Review.countDocuments(filter),

    Review.aggregate([
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
    ]),

    Review.aggregate([
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
    ]),
  ]);

  sendSuccessResponse(res, 200, "User reviews fetched successfully", {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      photo: user.photo,
    },
    reviews: {
      data: reviews,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
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

  assertSelfOrAdmin(req, id, "stats");

  const user = await User.findOne({
    _id: id,
    accountDeleted: false,
  });

  if (!user) {
    return sendNotFoundResponse(res, "User not found");
  }

  const assignedToursMatch = {
    _id: { $in: user.assignedTours || [] },
    isActive: true,
  };

  const [
    tourStats,
    reviewStats,
    difficultyDistribution,
    categoryDistribution,
    recentReviews,
    recentTours,
  ] = await Promise.all([
    Tour.aggregate([
      { $match: assignedToursMatch },
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
    ]),

    Review.aggregate([
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
    ]),

    Tour.aggregate([
      { $match: assignedToursMatch },
      { $group: { _id: "$difficulty", count: { $sum: 1 } } },
    ]),

    Tour.aggregate([
      { $match: assignedToursMatch },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),

    Review.find({
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

    Tour.find(assignedToursMatch)
      .sort("-createdAt")
      .limit(5)
      .select("name slug price duration difficulty imageCover")
      .lean(),
  ]);

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
    recentActivity: {
      recentReviews,
      assignedTours: recentTours,
    },
  });
});

/* ============================================================
   ADMIN LISTS / SEARCH
   ============================================================ */

const getUsersWithStats = catchAsync(async (req, res) => {
  const users = await User.aggregate([
    {
      $match: { accountDeleted: false, active: { $ne: false } },
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
        activeSessions: 0,
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
  const { q, role } = req.query;

  if (!q || typeof q !== "string" || !q.trim()) {
    return sendValidationErrorResponse(res, "Please provide a search query");
  }

  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 20,
  });

  const pattern = escapeRegex(q.trim());

  const searchQuery = {
    accountDeleted: false,
    $or: [
      { name: { $regex: pattern, $options: "i" } },
      { email: { $regex: pattern, $options: "i" } },
    ],
  };

  if (role) {
    if (!VALID_ROLES.includes(role)) {
      return sendValidationErrorResponse(
        res,
        `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`,
      );
    }

    searchQuery.role = role;
  }

  const [users, total] = await Promise.all([
    User.find(searchQuery)
      .select(SAFE_USER_SELECT)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 }),
    User.countDocuments(searchQuery),
  ]);

  sendSuccessResponse(res, 200, "Users search completed", users, {
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  });
});

/* ============================================================
   /me ENDPOINTS (current authenticated user)
   ============================================================ */

/* Canonical keys match the User schema. Aliases keep older clients working:
   `profileImage` -> `photo`, `phone` -> `phoneNumber`. */
const ALLOWED_ME_UPDATE_FIELDS = [
  "name",
  "photo",
  "bio",
  "phoneNumber",
  "dateOfBirth",
  "address",
  "preferences",
  "languages",
  "expertise",
];

const ME_FIELD_ALIASES = {
  profileImage: "photo",
  phone: "phoneNumber",
};

const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .select(SAFE_USER_SELECT)
    .populate({
      path: "assignedTours",
      select: "name slug price duration difficulty ratingsAverage imageCover",
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
        "This route is not for password updates. Please use /me/password.",
        400,
      ),
    );
  }

  if (req.body.role) {
    return next(new AppError("You cannot change your own role", 403));
  }

  const filteredBody = {};

  Object.entries(req.body).forEach(([rawKey, value]) => {
    const key = ME_FIELD_ALIASES[rawKey] || rawKey;

    if (!ALLOWED_ME_UPDATE_FIELDS.includes(key)) return;

    if (rawKey !== key && req.body[key] !== undefined) return;

    filteredBody[key] = value;
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

/* ---------- Password change (uses `matchPassword`) ---------- */

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

  const isCorrect = await user.matchPassword(currentPassword);

  if (!isCorrect) {
    return next(new AppError("Your current password is incorrect", 401));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;

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
