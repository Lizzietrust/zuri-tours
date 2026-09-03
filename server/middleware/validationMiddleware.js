import { body, param, query, validationResult } from "express-validator";
import mongoose from "mongoose";
import { AppError } from "../utils/appError.js";
import { sendValidationErrorResponse } from "../utils/responseHelper.js";

/**
 * Handle validation results from express-validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const validateResult = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => err.msg);

    return next(new AppError(messages.join(". "), 400));
  }
  next();
};

/**
 * Handle validation results with response helper
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const validateResultWithResponse = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return sendValidationErrorResponse(res, "Validation failed", errorMessages);
  }
  next();
};

export const checkValidId = (req, res, next) => {
  const { id, tourId, userId, guideId, reviewId } = req.params;

  const ids = [id, tourId, userId, guideId, reviewId].filter(Boolean);

  for (const idParam of ids) {
    if (mongoose.Types.ObjectId.isValid(idParam)) {
      req.parsedId = idParam;

      // eslint-disable-next-line no-continue
      continue;
    }

    const numericId = parseInt(idParam, 10);

    if (!Number.isNaN(numericId) && numericId >= 0) {
      req.parsedId = numericId;

      // eslint-disable-next-line no-continue
      continue;
    }

    return sendValidationErrorResponse(
      res,
      `Invalid ID format: "${idParam}". ID must be a valid ObjectId or positive number`,
    );
  }

  next();
};

export const checkValidIdParam = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id) {
      return sendValidationErrorResponse(res, `${paramName} is required`);
    }

    if (mongoose.Types.ObjectId.isValid(id)) {
      req.parsedId = id;

      return next();
    }

    const numericId = parseInt(id, 10);

    if (!Number.isNaN(numericId) && numericId >= 0) {
      req.parsedId = numericId;

      return next();
    }

    return sendValidationErrorResponse(
      res,
      `Invalid ${paramName} format. Must be a valid ObjectId or positive number`,
    );
  };
};

export const validateTourId = [
  param("tourId").optional().isMongoId().withMessage("Invalid tour ID format"),
  validateResult,
];

export const validateUserId = [
  param("userId").optional().isMongoId().withMessage("Invalid user ID format"),
  validateResult,
];

export const validateReviewId = [
  param("reviewId")
    .optional()
    .isMongoId()
    .withMessage("Invalid review ID format"),
  validateResult,
];

export const validateReview = [
  body("review")
    .notEmpty()
    .withMessage("Review text is required")
    .isString()
    .withMessage("Review must be a string")
    .isLength({ min: 5, max: 500 })
    .withMessage("Review must be between 5 and 500 characters"),

  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isNumeric()
    .withMessage("Rating must be a number")
    .isFloat({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),

  body("isRecommended")
    .optional()
    .isBoolean()
    .withMessage("isRecommended must be a boolean"),

  body("tourId").optional().isMongoId().withMessage("Invalid tour ID format"),

  validateResult,
];

/**
 * Validate review with response helper
 */
export const validateReviewWithResponse = [
  body("review")
    .notEmpty()
    .withMessage("Review text is required")
    .isString()
    .withMessage("Review must be a string")
    .isLength({ min: 5, max: 500 })
    .withMessage("Review must be between 5 and 500 characters"),

  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isNumeric()
    .withMessage("Rating must be a number")
    .isFloat({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),

  body("isRecommended")
    .optional()
    .isBoolean()
    .withMessage("isRecommended must be a boolean"),

  body("tourId").optional().isMongoId().withMessage("Invalid tour ID format"),

  validateResultWithResponse,
];

export const checkTourBody = (req, res, next) => {
  const { name, price, duration, difficulty } = req.body;
  const errors = [];

  if (!name) {
    errors.push("Missing tour name. Please provide a name for the tour");
  }

  if (price === undefined || price === null) {
    errors.push("Missing tour price. Please provide a price for the tour");
  } else if (typeof price !== "number" || price < 0) {
    errors.push("Invalid price. Price must be a positive number");
  }

  if (!difficulty) {
    errors.push(
      "Missing tour difficulty. Please provide difficulty level (easy/medium/difficult)",
    );
  }

  if (duration === undefined || duration === null) {
    errors.push("Missing tour duration. Please provide duration in days");
  } else if (typeof duration !== "number" || duration < 1) {
    errors.push("Invalid duration. Duration must be a positive number");
  }

  if (errors.length > 0) {
    return sendValidationErrorResponse(res, errors.join(". "));
  }

  next();
};

/**
 * Validate tour body using express-validator
 */
export const validateTourBody = [
  body("name")
    .notEmpty()
    .withMessage("Tour name is required")
    .isString()
    .withMessage("Name must be a string")
    .isLength({ min: 3, max: 100 })
    .withMessage("Name must be between 3 and 100 characters")
    .trim(),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isNumeric()
    .withMessage("Price must be a number")
    .isFloat({ min: 0 })
    .withMessage("Price cannot be negative"),

  body("duration")
    .notEmpty()
    .withMessage("Duration is required")
    .isNumeric()
    .withMessage("Duration must be a number")
    .isInt({ min: 1 })
    .withMessage("Duration must be at least 1 day"),

  body("difficulty")
    .notEmpty()
    .withMessage("Difficulty is required")
    .isIn(["easy", "medium", "difficult"])
    .withMessage("Difficulty must be easy, medium, or difficult"),

  body("maxGroupSize")
    .optional()
    .isNumeric()
    .withMessage("Max group size must be a number")
    .isInt({ min: 1 })
    .withMessage("Max group size must be at least 1"),

  body("summary")
    .optional()
    .isString()
    .withMessage("Summary must be a string")
    .isLength({ max: 200 })
    .withMessage("Summary cannot exceed 200 characters")
    .trim(),

  body("category")
    .optional()
    .isIn(["adventure", "cultural", "nature", "city", "beach", "mountain"])
    .withMessage("Invalid category"),

  validateResult,
];

export const validateUser = (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  const errors = [];

  if (!name) {
    errors.push("Name is required");
  } else if (name.length < 2 || name.length > 50) {
    errors.push("Name must be between 2 and 50 characters");
  }

  if (!email) {
    errors.push("Email is required");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      errors.push("Invalid email format. Please provide a valid email address");
    }
  }

  if (req.method === "POST" || req.method === "PUT") {
    if (!password) {
      errors.push("Password is required");
    } else if (password.length < 6) {
      errors.push("Password must be at least 6 characters");
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.push("Password must contain uppercase, lowercase, and number");
    }

    if (req.method === "POST" || req.body.passwordConfirm !== undefined) {
      if (!passwordConfirm) {
        errors.push("Password confirmation is required");
      } else if (password && password !== passwordConfirm) {
        errors.push("Passwords do not match");
      }
    }
  }

  if (errors.length > 0) {
    return sendValidationErrorResponse(res, errors.join(", "));
  }

  next();
};

/**
 * Validate user using express-validator
 */
export const validateUserWithExpress = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .trim(),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and number"),

  body("role")
    .optional()
    .isIn(["user", "guide", "lead-guide", "admin"])
    .withMessage("Invalid role"),

  body("phone")
    .optional()
    .isString()
    .withMessage("Phone must be a string")
    .trim(),

  body("bio")
    .optional()
    .isString()
    .withMessage("Bio must be a string")
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),

  validateResult,
];

export const checkUserBody = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name) {
    errors.push("Missing user name. Please provide a name");
  }

  if (!email) {
    errors.push("Missing user email. Please provide an email address");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      errors.push("Invalid email format. Please provide a valid email address");
    }
  }

  if (!password) {
    errors.push("Missing password. Please provide a password");
  } else if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (errors.length > 0) {
    return sendValidationErrorResponse(res, errors.join(", "));
  }

  next();
};

export const validateAuth = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendValidationErrorResponse(
      res,
      "Please provide email and password",
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return sendValidationErrorResponse(
      res,
      "Invalid email format. Please provide a valid email address",
    );
  }

  next();
};

/**
 * Validate auth using express-validator
 */
export const validateAuthWithExpress = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isString()
    .withMessage("Password must be a string"),

  validateResult,
];

export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  query("sort")
    .optional()
    .isString()
    .withMessage("Sort must be a string")
    .trim(),

  validateResult,
];

export const validateSearch = [
  query("q")
    .optional()
    .isString()
    .withMessage("Search query must be a string")
    .isLength({ min: 1 })
    .withMessage("Search query cannot be empty")
    .trim(),

  query("location")
    .optional()
    .isString()
    .withMessage("Location must be a string")
    .trim(),

  query("minPrice")
    .optional()
    .isNumeric()
    .withMessage("Min price must be a number")
    .isFloat({ min: 0 })
    .withMessage("Min price cannot be negative")
    .toFloat(),

  query("maxPrice")
    .optional()
    .isNumeric()
    .withMessage("Max price must be a number")
    .isFloat({ min: 0 })
    .withMessage("Max price cannot be negative")
    .toFloat(),

  query("difficulty")
    .optional()
    .isIn(["easy", "medium", "difficult"])
    .withMessage("Difficulty must be easy, medium, or difficult"),

  query("minRating")
    .optional()
    .isNumeric()
    .withMessage("Min rating must be a number")
    .isFloat({ min: 0, max: 5 })
    .withMessage("Min rating must be between 0 and 5")
    .toFloat(),

  query("maxDuration")
    .optional()
    .isNumeric()
    .withMessage("Max duration must be a number")
    .isInt({ min: 1 })
    .withMessage("Max duration must be at least 1")
    .toInt(),

  validateResult,
];

export const validateTourUpdate = [
  body("name")
    .optional()
    .isString()
    .withMessage("Name must be a string")
    .isLength({ min: 3, max: 100 })
    .withMessage("Name must be between 3 and 100 characters")
    .trim(),

  body("price")
    .optional()
    .isNumeric()
    .withMessage("Price must be a number")
    .isFloat({ min: 0 })
    .withMessage("Price cannot be negative"),

  body("duration")
    .optional()
    .isNumeric()
    .withMessage("Duration must be a number")
    .isInt({ min: 1 })
    .withMessage("Duration must be at least 1 day"),

  body("difficulty")
    .optional()
    .isIn(["easy", "medium", "difficult"])
    .withMessage("Difficulty must be easy, medium, or difficult"),

  body("maxGroupSize")
    .optional()
    .isNumeric()
    .withMessage("Max group size must be a number")
    .isInt({ min: 1 })
    .withMessage("Max group size must be at least 1"),

  validateResult,
];

/**
 * Validate user update (partial update)
 */
export const validateUserUpdate = [
  body("name")
    .optional()
    .isString()
    .withMessage("Name must be a string")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .trim(),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("phone")
    .optional()
    .isString()
    .withMessage("Phone must be a string")
    .trim(),

  body("bio")
    .optional()
    .isString()
    .withMessage("Bio must be a string")
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),

  body("profileImage")
    .optional()
    .isString()
    .withMessage("Profile image must be a string")
    .isURL()
    .withMessage("Profile image must be a valid URL"),

  validateResult,
];

export default {
  validateResult,
  validateResultWithResponse,

  checkValidId,
  checkValidIdParam,
  validateTourId,
  validateUserId,
  validateReviewId,

  validateReview,
  validateReviewWithResponse,

  checkTourBody,
  validateTourBody,
  validateTourUpdate,

  validateUser,
  validateUserWithExpress,
  checkUserBody,
  validateUserUpdate,

  validateAuth,
  validateAuthWithExpress,

  validatePagination,
  validateSearch,
};
