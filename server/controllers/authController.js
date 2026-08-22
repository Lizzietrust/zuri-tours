import crypto from "crypto";
import User from "../models/User.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  sendSuccessResponse,
  sendValidationErrorResponse,
  sendUnauthorizedResponse,
} from "../utils/responseHelper.js";
import { Email } from "../utils/email.js";

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

  try {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    await new Email(user, `${clientUrl}/dashboard`).sendWelcome();
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (emailError) {
    console.error("❌ Failed to send welcome email:", emailError.message);
  }

  const token = user.getSignedJwtToken();

  const userWithoutPassword = user.toObject();

  delete userWithoutPassword.password;

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

  const user = await User.findOne({ email })
    .select("+password +passwordChangedAt +accountDeleted +tokenVersion")
    .select("+loginAttempts +lockUntil");

  if (!user) {
    return sendUnauthorizedResponse(res, "Invalid email or password");
  }

  if (user.accountDeleted) {
    return sendUnauthorizedResponse(res, "Account has been deleted");
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.lockUntil - new Date()) / 60000);

    return sendUnauthorizedResponse(
      res,
      `Account is locked. Please try again in ${remainingMinutes} minutes`,
    );
  }

  const isPasswordMatch = await user.matchPassword(password);

  if (!isPasswordMatch) {
    await user.handleFailedLogin();
    const remainingAttempts = 5 - user.loginAttempts;

    return sendUnauthorizedResponse(
      res,
      `Invalid credentials. ${remainingAttempts} attempts remaining`,
    );
  }

  await user.resetLoginAttempts();

  const token = user.getSignedJwtToken();

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res.cookie("token", token, cookieOptions);

  const userWithoutPassword = user.toObject();

  delete userWithoutPassword.password;

  sendSuccessResponse(res, 200, "Login successful", {
    user: userWithoutPassword,
    token,
  });
});

export const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select("-password")
    .select("+lastLogin");

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

  const user = await User.findById(req.user.id).select(
    "+password +passwordChangedAt +tokenVersion",
  );

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
    return sendValidationErrorResponse(
      res,
      "No user found with that email address",
    );
  }

  if (user.accountDeleted) {
    return sendValidationErrorResponse(res, "Account has been deleted");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${req.protocol}://${req.get(
      "host",
    )}/api/v1/auth/resetpassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    sendSuccessResponse(
      res,
      200,
      "Password reset link sent to your email address",
    );
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    console.error("Email sending failed:", error);

    return sendValidationErrorResponse(
      res,
      "Failed to send password reset email. Please try again later.",
    );
  }
});

export const resetPassword = catchAsync(async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+passwordChangedAt +tokenVersion +accountDeleted");

  if (!user) {
    return sendValidationErrorResponse(
      res,
      "Password reset token is invalid or has expired",
    );
  }

  if (user.accountDeleted) {
    return sendValidationErrorResponse(res, "Account has been deleted");
  }

  const { password, passwordConfirm } = req.body;

  if (!password || !passwordConfirm) {
    return sendValidationErrorResponse(
      res,
      "Please provide a password and password confirmation",
    );
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
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

export const invalidateAllSessions = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);

  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save({ validateBeforeSave: false });

  sendSuccessResponse(res, 200, "All sessions invalidated successfully");
});

export const deleteAccount = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);

  await user.softDelete();

  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  sendSuccessResponse(res, 200, "Account deleted successfully");
});
