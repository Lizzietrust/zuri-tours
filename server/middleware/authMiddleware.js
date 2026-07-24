import jwt from "jsonwebtoken"; // eslint-disable-line import/no-extraneous-dependencies
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

    const user = await User.findById(decoded.id);

    if (!user) {
      return sendUnauthorizedResponse(res, "User not found with this token");
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
