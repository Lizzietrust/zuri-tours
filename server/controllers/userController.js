import User from "../models/User.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  sendSuccessResponse,
  sendNotFoundResponse,
  sendValidationErrorResponse,
} from "../utils/responseHelper.js";

export const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find().select("-password");

  sendSuccessResponse(res, 200, "Users fetched successfully", users, {
    results: users.length,
  });
});

export const getUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

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

  const user = await User.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

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

  await user.deleteOne();

  res.status(204).json({
    status: "success",
    data: null,
  });
});
