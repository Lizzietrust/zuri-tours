import { AppError } from "../utils/appError.js";

/* ============================================================
   CAST ERROR — invalid ObjectId
   ============================================================ */

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;

  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const keyPattern = err.keyPattern || {};
  const keyValue = err.keyValue || {};
  const keys = Object.keys(keyPattern);

  if (keyPattern.tour && keyPattern.user) {
    return new AppError("You have already reviewed this tour", 400);
  }

  if (keys.length > 0) {
    const field = keys[0];
    const value = keyValue[field] ?? "value";

    return new AppError(
      `Duplicate value for ${field}: "${value}". Please use another value!`,
      400,
    );
  }

  if (typeof err.errmsg === "string") {
    const match = err.errmsg.match(/(["'])(\\?.)*?\1/);

    if (match && match[0]) {
      return new AppError(
        `Duplicate field value: ${match[0]}. Please use another value!`,
        400,
      );
    }
  }

  return new AppError(
    "Duplicate value detected. Please use another value!",
    400,
  );
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;

  return new AppError(message, 400);
};

/* ============================================================
   JWT ERRORS
   ============================================================ */

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

/* ============================================================
   RESPONSE SHAPES
   ============================================================ */

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error("ERROR 💥", err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

const errorHandler = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    return sendErrorDev(err, res);
  }

  let error = { ...err, message: err.message };

  if (error.name === "CastError") {
    error = handleCastErrorDB(error);
  } else if (error.code === 11000) {
    error = handleDuplicateFieldsDB(error);
  } else if (error.name === "ValidationError") {
    error = handleValidationErrorDB(error);
  } else if (error.name === "JsonWebTokenError") {
    error = handleJWTError();
  } else if (error.name === "TokenExpiredError") {
    error = handleJWTExpiredError();
  }

  return sendErrorProd(error, res);
};

export default errorHandler;
