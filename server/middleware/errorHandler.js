import { AppError } from "../utils/appError.js";
import { sendErrorResponse } from "../utils/responseHelper.js";

export const notFound = (req, res, next) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);

  next(error);
};

export const errorHandler = (err, req, res) => {
  let error = { ...err };

  error.message = err.message;

  if (process.env.NODE_ENV === "development") {
    console.error("❌ Error Details:");
    console.error("  Name:", err.name);
    console.error("  Message:", err.message);
    console.error("  Stack:", err.stack);
    if (err.code) console.error("  Code:", err.code);
    if (err.path) console.error("  Path:", err.path);
    if (err.value) console.error("  Value:", err.value);
    if (err.keyPattern) console.error("  Key Pattern:", err.keyPattern);
    if (err.errors) console.error("  Validation Errors:", err.errors);
  } else {
    console.error("❌ Error:", err.message);
    console.error("  Status Code:", err.statusCode || 500);
    console.error("  Path:", req.path);
    console.error("  Method:", req.method);
  }

  if (err.name === "CastError") {
    const message = `Invalid ${err.path}: ${err.value}`;

    error = new AppError(message, 400);
    error.status = "fail";
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `Duplicate field value: "${err.keyValue[field]}". Please use another value for ${field}`;

    error = new AppError(message, 400);
    error.status = "fail";
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);

    error = new AppError(messages.join(". "), 400);
    error.status = "fail";
    error.errors = err.errors;
  }

  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token. Please log in again.", 401);
    error.status = "fail";
  }

  if (err.name === "TokenExpiredError") {
    error = new AppError("Your token has expired. Please log in again.", 401);
    error.status = "fail";
  }

  if (err.name === "RateLimitError") {
    error = new AppError("Too many requests. Please try again later.", 429);
    error.status = "fail";
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    error = new AppError(
      "Invalid JSON payload. Please check your request body.",
      400,
    );
    error.status = "fail";
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    error = new AppError("File too large. Maximum file size is 10MB.", 400);
    error.status = "fail";
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    error = new AppError(
      "Unexpected file field. Please check your file upload.",
      400,
    );
    error.status = "fail";
  }

  const useResponseHelper = typeof sendErrorResponse === "function";

  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || err.message || "Something went wrong";

  if (err.isOperational) {
    error.status = err.status || "error";
  }

  if (useResponseHelper) {
    if (process.env.NODE_ENV === "development") {
      return sendErrorResponse(
        res,
        statusCode,
        message,
        err,
        err.errors || undefined,
      );
    }

    return sendErrorResponse(
      res,
      statusCode,
      message,
      null,
      err.errors || undefined,
    );
  }

  const response = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV === "development") {
    response.error = err;
    response.stack = err.stack;
    response.name = err.name;
  }

  if (err.errors || error.errors) {
    response.errors = err.errors || error.errors;
  }

  if (err.code) {
    response.code = err.code;
  }

  return res.status(statusCode).json(response);
};

/**
 * Wraps async route handlers to catch errors automatically
 * This eliminates the need for try-catch blocks in route handlers
 *
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
export const asyncWrapper = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const handleUnhandledRejections = (server) => {
  process.on("unhandledRejection", (err) => {
    console.error("❌ UNHANDLED REJECTION! 💥 Shutting down...");
    console.error(err.name, err.message);
    console.error(err.stack);
    server.close(() => {
      console.error("💥 Server shutting down due to unhandled rejection");
      process.exit(1);
    });
  });
};

export const handleUncaughtExceptions = () => {
  process.on("uncaughtException", (err) => {
    console.error("❌ UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.error(err.name, err.message);
    console.error(err.stack);
    process.exit(1);
  });
};

export default {
  notFound,
  errorHandler,
  asyncWrapper,
  handleUnhandledRejections,
  handleUncaughtExceptions,
};
