import User from "../models/User.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  sendSuccessResponse,
  sendNotFoundResponse,
  sendValidationErrorResponse,
} from "../utils/responseHelper.js";

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
  }).select(
    "-password -passwordChangedAt -resetPasswordToken -resetPasswordExpire",
  );

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

  const user = await User.findOneAndUpdate(
    { _id: req.params.id, accountDeleted: false },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  ).select(
    "-password -passwordChangedAt -resetPasswordToken -resetPasswordExpire",
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
  ).select(
    "-password -passwordChangedAt -resetPasswordToken -resetPasswordExpire",
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
  }).select(
    "-password -passwordChangedAt -resetPasswordToken -resetPasswordExpire",
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
