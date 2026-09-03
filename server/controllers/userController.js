import User from "../models/User.js";
import Tour from "../models/Tour.js";
import Review from "../models/Review.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  sendSuccessResponse,
  sendNotFoundResponse,
  sendValidationErrorResponse,
} from "../utils/responseHelper.js";
// import { AppError } from "../utils/appError.js";

export const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find({ accountDeleted: false })
    .select(
      "-password -passwordChangedAt -resetPasswordToken -resetPasswordExpire",
    )
    .select(
      "-loginAttempts -lockUntil -tokenVersion -accountDeleted -accountDeletedAt",
    );

  sendSuccessResponse(res, 200, "Users fetched successfully", users, {
    results: users.length,
  });
});

export const getUser = catchAsync(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    accountDeleted: false,
  })
    .select(
      "-password -passwordChangedAt -resetPasswordToken -resetPasswordExpire",
    )
    .select(
      "-loginAttempts -lockUntil -tokenVersion -accountDeleted -accountDeletedAt",
    )
    .populate({
      path: "assignedTours",
      select: "name slug price duration difficulty ratingsAverage imageCover",
      populate: {
        path: "guides",
        select: "name email profileImage",
      },
    })
    .populate({
      path: "bookings.tour",
      select: "name slug price duration difficulty imageCover",
    })
    .lean();

  if (!user) {
    return sendNotFoundResponse(res, "User not found");
  }

  sendSuccessResponse(res, 200, "User fetched successfully", user);
});

export const createUser = catchAsync(async (req, res) => {
  const { name, email, password, photo, role } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return sendValidationErrorResponse(res, "Email already registered");
  }

  const user = await User.create({
    name,
    email,
    password,
    photo,
    role: role || "user",
  });

  const userWithoutPassword = user.toObject();

  delete userWithoutPassword.password;

  sendSuccessResponse(res, 201, "User created successfully", {
    user: userWithoutPassword,
  });
});

export const updateUser = catchAsync(async (req, res) => {
  const {
    password,
    passwordConfirm: _passwordConfirm,
    ...updateData
  } = req.body;

  if (password) {
    return sendValidationErrorResponse(
      res,
      "Use the password reset route to update password",
    );
  }

  delete updateData.role;
  delete updateData.accountDeleted;
  delete updateData.tokenVersion;
  delete updateData.passwordChangedAt;
  delete updateData.loginAttempts;
  delete updateData.lockUntil;
  delete updateData._id;
  delete updateData.createdAt;
  delete updateData.updatedAt;

  const user = await User.findOneAndUpdate(
    { _id: req.params.id, accountDeleted: false },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  )
    .select(
      "-password -passwordChangedAt -resetPasswordToken -resetPasswordExpire",
    )
    .select(
      "-loginAttempts -lockUntil -tokenVersion -accountDeleted -accountDeletedAt",
    );

  if (!user) {
    return sendNotFoundResponse(res, "User not found");
  }

  sendSuccessResponse(res, 200, "User updated successfully", user);
});

export const deleteUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return sendNotFoundResponse(res, "User not found");
  }

  await user.softDelete();

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const updateUserRole = catchAsync(async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;

  if (!role) {
    return sendValidationErrorResponse(res, "Please provide a role");
  }

  const validRoles = ["user", "guide", "lead-guide", "admin"];

  if (!validRoles.includes(role)) {
    return sendValidationErrorResponse(
      res,
      `Invalid role. Must be one of: ${validRoles.join(", ")}`,
    );
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    {
      new: true,
      runValidators: true,
    },
  )
    .select(
      "-password -passwordChangedAt -resetPasswordToken -resetPasswordExpire",
    )
    .select(
      "-loginAttempts -lockUntil -tokenVersion -accountDeleted -accountDeletedAt",
    );

  if (!user) {
    return sendNotFoundResponse(res, "User not found");
  }

  sendSuccessResponse(res, 200, "User role updated successfully", user);
});

export const getUsersByRole = catchAsync(async (req, res) => {
  const { role } = req.params;
  const validRoles = ["user", "guide", "lead-guide", "admin"];

  if (!validRoles.includes(role)) {
    return sendValidationErrorResponse(
      res,
      `Invalid role. Must be one of: ${validRoles.join(", ")}`,
    );
  }

  const users = await User.find({
    role,
    accountDeleted: false,
  })
    .select(
      "-password -passwordChangedAt -resetPasswordToken -resetPasswordExpire",
    )
    .select(
      "-loginAttempts -lockUntil -tokenVersion -accountDeleted -accountDeletedAt",
    );

  sendSuccessResponse(
    res,
    200,
    `Users with role '${role}' fetched successfully`,
    users,
    {
      results: users.length,
    },
  );
});

export const getUserTours = catchAsync(async (req, res) => {
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

export const getUserReviews = catchAsync(async (req, res) => {
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

export const getUserStats = catchAsync(async (req, res) => {
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

export const getUsersWithStats = catchAsync(async (req, res) => {
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

export const searchUsers = catchAsync(async (req, res) => {
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
    .select(
      "-password -passwordChangedAt -resetPasswordToken -resetPasswordExpire",
    )
    .select(
      "-loginAttempts -lockUntil -tokenVersion -accountDeleted -accountDeletedAt",
    )
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

export const bulkUpdateUsers = catchAsync(async (req, res) => {
  const { userIds, updateData } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return sendValidationErrorResponse(
      res,
      "Please provide an array of user IDs",
    );
  }

  if (!updateData || Object.keys(updateData).length === 0) {
    return sendValidationErrorResponse(res, "Please provide update data");
  }

  delete updateData.password;
  delete updateData.role;
  delete updateData.accountDeleted;
  delete updateData.tokenVersion;
  delete updateData.passwordChangedAt;
  delete updateData.loginAttempts;
  delete updateData.lockUntil;

  const result = await User.updateMany(
    { _id: { $in: userIds }, accountDeleted: false },
    updateData,
    { runValidators: true },
  );

  sendSuccessResponse(res, 200, "Users updated successfully", {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  });
});

export const bulkDeleteUsers = catchAsync(async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return sendValidationErrorResponse(
      res,
      "Please provide an array of user IDs",
    );
  }

  const result = await User.updateMany(
    { _id: { $in: userIds }, accountDeleted: false },
    {
      accountDeleted: true,
      accountDeletedAt: new Date(),
    },
  );

  sendSuccessResponse(res, 200, "Users deleted successfully", {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  });
});
