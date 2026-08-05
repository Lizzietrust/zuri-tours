import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Tour from "../models/Tour.js";
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
        `User role '${req.user.role}' is not authorized to access this route. Required roles: ${roles.join(", ")}`,
      );
    }
    next();
  };
};

export const hasPermission = (permission) => {
  const permissions = {
    "manage:users": ["admin"],
    "manage:roles": ["admin"],
    "manage:system": ["admin"],

    "manage:guides": ["lead-guide", "admin"],
    "assign:tours": ["lead-guide", "admin"],
    "manage:all-tours": ["lead-guide", "admin"],
    "manage:guide-schedule": ["lead-guide", "admin"],
    "delete:tours": ["lead-guide", "admin"],

    "view:assigned-tours": ["guide", "lead-guide", "admin"],
    "manage:assigned-tours": ["guide", "lead-guide", "admin"],
    "view:guide-dashboard": ["guide", "lead-guide", "admin"],
    "update:tour-status": ["guide", "lead-guide", "admin"],
    "view:guide-reviews": ["guide", "lead-guide", "admin"],

    "view:tours": ["user", "guide", "lead-guide", "admin"],
    "book:tours": ["user", "guide", "lead-guide", "admin"],
    "review:tours": ["user", "guide", "lead-guide", "admin"],
  };

  return (req, res, next) => {
    const allowedRoles = permissions[permission];

    if (!allowedRoles) {
      return sendForbiddenResponse(res, "Invalid permission requested");
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendForbiddenResponse(
        res,
        `Your role '${req.user.role}' doesn't have permission to ${permission}`,
      );
    }

    next();
  };
};

export const isGuide = (req, res, next) => {
  if (!req.user.isGuide()) {
    return sendForbiddenResponse(res, "Only guides can access this route");
  }
  next();
};

export const isLeadGuideOrAdmin = (req, res, next) => {
  if (req.user.role !== "lead-guide" && req.user.role !== "admin") {
    return sendForbiddenResponse(
      res,
      "Only lead guides and admins can access this route",
    );
  }
  next();
};

export const hasTourAccess = async (req, res, next) => {
  const { id: tourId } = req.params;

  if (req.user.role === "admin" || req.user.role === "lead-guide") {
    return next();
  }

  if (req.user.role === "guide") {
    const user = await User.findById(req.user._id).populate("assignedTours");

    const hasAccess = user.assignedTours.some(
      (tour) => tour._id.toString() === tourId,
    );

    if (!hasAccess) {
      return sendForbiddenResponse(res, "You don't have access to this tour");
    }

    return next();
  }

  return sendForbiddenResponse(
    res,
    "You don't have permission to access this tour",
  );
};

export const canDeleteTour = async (req, res, next) => {
  try {
    if (req.user.role === "admin") {
      return next();
    }

    if (req.user.role === "lead-guide") {
      const tour = await Tour.findById(req.params.id);

      if (!tour) {
        return sendForbiddenResponse(res, "Tour not found");
      }

      if (
        tour.createdBy &&
        tour.createdBy.toString() === req.user._id.toString()
      ) {
        return next();
      }

      if (
        tour.guides &&
        tour.guides.some(
          (guideId) => guideId.toString() === req.user._id.toString(),
        )
      ) {
        return next();
      }

      return sendForbiddenResponse(
        res,
        "You can only delete tours that you created or are assigned to",
      );
    }

    return sendForbiddenResponse(res, "Not authorized to delete tours");
  } catch (error) {
    return sendForbiddenResponse(res, "Error checking deletion permissions");
  }
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
