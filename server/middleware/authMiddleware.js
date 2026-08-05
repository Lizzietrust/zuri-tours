import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  sendUnauthorizedResponse,
  sendForbiddenResponse,
} from "../utils/responseHelper.js";

export const protect = async (req, res, next) => {
  let token;

  const { authorization } = req.headers;

  if (authorization && authorization.startsWith("Bearer")) {
    [, token] = authorization.split(" ");
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return sendUnauthorizedResponse(res, "Not authorized to access this route");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "+passwordChangedAt +accountDeleted +tokenVersion +lockUntil",
    );

    if (!user) {
      return sendUnauthorizedResponse(res, "User no longer exists");
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

    if (user.changedPasswordAfter(decoded.iat)) {
      return sendUnauthorizedResponse(
        res,
        "Password was recently changed. Please log in again",
      );
    }

    if (user.tokenVersion && user.tokenVersion !== decoded.tokenVersion) {
      return sendUnauthorizedResponse(
        res,
        "Session expired. Please log in again",
      );
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return sendUnauthorizedResponse(res, "Invalid token");
    }

    if (error.name === "TokenExpiredError") {
      return sendUnauthorizedResponse(res, "Token expired");
    }

    return sendUnauthorizedResponse(res, "Not authorized to access this route");
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendForbiddenResponse(
        res,
        `User role '${req.user.role}' is not authorized to access this route`,
      );
    }
    next();
  };
};

export const checkLoginAttempts = async (req, res, next) => {
  const { email } = req.body;

  if (!email) return next();

  const user = await User.findOne({ email }).select(
    "+lockUntil +loginAttempts",
  );

  if (!user) return next();

  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.lockUntil - new Date()) / 60000);

    return sendUnauthorizedResponse(
      res,
      `Too many failed attempts. Account locked for ${remainingMinutes} minutes`,
    );
  }

  req._loginUser = user;
  next();
};
