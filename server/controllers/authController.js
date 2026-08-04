import crypto from "crypto";
import User from "../models/User.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  sendSuccessResponse,
  sendValidationErrorResponse,
  sendUnauthorizedResponse,
} from "../utils/responseHelper.js";

export const register = catchAsync(async (req, res) => {
  const { name, email, password, passwordConfirm, photo } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return sendValidationErrorResponse(res, "Email already registered");
  }

  const user = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    photo,
  });

  const token = user.getSignedJwtToken();

  const userWithoutPassword = user.toObject();

  delete userWithoutPassword.password;
  delete userWithoutPassword.passwordConfirm;

  sendSuccessResponse(res, 201, "User registered successfully", {
    user: userWithoutPassword,
    token,
  });
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendValidationErrorResponse(
      res,
      "Please provide email and password",
    );
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return sendUnauthorizedResponse(res, "Invalid email or password");
  }

  const isPasswordMatch = await user.matchPassword(password);

  if (!isPasswordMatch) {
    return sendUnauthorizedResponse(res, "Invalid email or password");
  }

  const token = user.getSignedJwtToken();

  const userWithoutPassword = user.toObject();

  delete userWithoutPassword.password;

  sendSuccessResponse(res, 200, "Login successful", {
    user: userWithoutPassword,
    token,
  });
});

export const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  sendSuccessResponse(res, 200, "User profile fetched successfully", user);
});

export const updatePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  if (!currentPassword || !newPassword || !newPasswordConfirm) {
    return sendValidationErrorResponse(
      res,
      "Please provide current password, new password, and confirm password",
    );
  }

  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatch = await user.matchPassword(currentPassword);

  if (!isPasswordMatch) {
    return sendValidationErrorResponse(res, "Current password is incorrect");
  }

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();

  const token = user.getSignedJwtToken();

  const userWithoutPassword = user.toObject();

  delete userWithoutPassword.password;

  sendSuccessResponse(res, 200, "Password updated successfully", {
    user: userWithoutPassword,
    token,
  });
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendValidationErrorResponse(res, "Please provide an email");
  }

  const user = await User.findOne({ email });

  if (!user) {
    return sendValidationErrorResponse(res, "No user found with that email");
  }

  const resetToken = crypto.randomBytes(20).toString("hex");

  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get(
    "host",
  )}/api/v1/auth/resetpassword/${resetToken}`;

  // await sendEmail({
  //   email: user.email,
  //   subject: "Password reset token",
  //   message,
  // });

  sendSuccessResponse(res, 200, "Password reset email sent", {
    resetToken,
    resetUrl,
  });
});

export const resetPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return sendValidationErrorResponse(res, "Invalid or expired token");
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  const token = user.getSignedJwtToken();

  const userWithoutPassword = user.toObject();

  delete userWithoutPassword.password;

  sendSuccessResponse(res, 200, "Password reset successful", {
    user: userWithoutPassword,
    token,
  });
});

export const logout = catchAsync((req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  sendSuccessResponse(res, 200, "Logged out successfully");
});
