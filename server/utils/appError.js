/**
 * Custom error class for application errors
 * Extends the built-in Error class with additional properties
 * for better error handling and response formatting
 */
export class AppError extends Error {
  /**
   * Create a new AppError
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {Object} options - Additional options
   * @param {string} options.code - Custom error code (e.g., 'AUTH_001')
   * @param {string} options.status - Custom status (overrides default)
   * @param {Object} options.errors - Validation errors object
   * @param {boolean} options.isOperational - Whether error is operational (default: true)
   * @param {*} options.data - Additional data to include with error
   */
  constructor(message, statusCode = 500, options = {}) {
    super(message);

    this.statusCode = statusCode;
    this.status =
      options.status || `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational =
      options.isOperational !== undefined ? options.isOperational : true;

    this.code = options.code || null;
    this.errors = options.errors || null;
    this.data = options.data || null;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   * @param {string} message - Error message
   * @param {Object} errors - Validation errors (optional)
   * @param {string} code - Error code (optional)
   * @returns {AppError}
   */
  static badRequest(message = "Bad request", errors = null, code = null) {
    return new AppError(message, 400, { errors, code, status: "fail" });
  }

  /**
   * Create a 401 Unauthorized error
   * @param {string} message - Error message
   * @param {string} code - Error code (optional)
   * @returns {AppError}
   */
  static unauthorized(message = "Unauthorized", code = null) {
    return new AppError(message, 401, { code, status: "fail" });
  }

  /**
   * Create a 403 Forbidden error
   * @param {string} message - Error message
   * @param {string} code - Error code (optional)
   * @returns {AppError}
   */
  static forbidden(message = "Forbidden", code = null) {
    return new AppError(message, 403, { code, status: "fail" });
  }

  /**
   * Create a 404 Not Found error
   * @param {string} message - Error message
   * @param {string} code - Error code (optional)
   * @returns {AppError}
   */
  static notFound(message = "Resource not found", code = null) {
    return new AppError(message, 404, { code, status: "fail" });
  }

  /**
   * Create a 409 Conflict error
   * @param {string} message - Error message
   * @param {Object} errors - Validation errors (optional)
   * @param {string} code - Error code (optional)
   * @returns {AppError}
   */
  static conflict(
    message = "Resource already exists",
    errors = null,
    code = null,
  ) {
    return new AppError(message, 409, { errors, code, status: "fail" });
  }

  /**
   * Create a 422 Unprocessable Entity error
   * @param {string} message - Error message
   * @param {Object} errors - Validation errors (optional)
   * @param {string} code - Error code (optional)
   * @returns {AppError}
   */
  static unprocessable(
    message = "Unprocessable entity",
    errors = null,
    code = null,
  ) {
    return new AppError(message, 422, { errors, code, status: "fail" });
  }

  /**
   * Create a 429 Too Many Requests error
   * @param {string} message - Error message
   * @param {string} code - Error code (optional)
   * @returns {AppError}
   */
  static tooManyRequests(
    message = "Too many requests, please try again later",
    code = null,
  ) {
    return new AppError(message, 429, { code, status: "fail" });
  }

  /**
   * Create a 500 Internal Server Error
   * @param {string} message - Error message
   * @param {string} code - Error code (optional)
   * @param {*} data - Additional data (optional)
   * @returns {AppError}
   */
  static internal(message = "Internal server error", code = null, data = null) {
    return new AppError(message, 500, { code, data, status: "error" });
  }

  /**
   * Create a validation error with multiple field errors
   * @param {Object} errors - Validation errors object { field: message }
   * @param {string} message - Overall error message
   * @returns {AppError}
   */
  static validation(errors, message = "Validation failed") {
    return new AppError(message, 400, {
      errors,
      code: "VALIDATION_ERROR",
      status: "fail",
    });
  }

  /**
   * Create an error from a Mongoose validation error
   * @param {Object} mongooseError - Mongoose validation error
   * @returns {AppError}
   */
  static fromMongooseValidation(mongooseError) {
    const errors = {};
    const messages = [];

    Object.values(mongooseError.errors).forEach((err) => {
      errors[err.path] = err.message;
      messages.push(err.message);
    });

    return new AppError(messages.join(". "), 400, {
      errors,
      code: "VALIDATION_ERROR",
      status: "fail",
    });
  }

  /**
   * Create an error from a Mongoose duplicate key error
   * @param {Object} mongooseError - Mongoose duplicate key error
   * @returns {AppError}
   */
  static fromMongooseDuplicate(mongooseError) {
    const field = Object.keys(mongooseError.keyPattern)[0];
    const value = mongooseError.keyValue[field];

    return new AppError(
      `Duplicate field value: "${value}". Please use another value for ${field}`,
      400,
      {
        code: "DUPLICATE_ERROR",
        status: "fail",
        data: { field, value },
      },
    );
  }

  /**
   * Create an error from a Mongoose CastError (invalid ObjectId)
   * @param {Object} mongooseError - Mongoose cast error
   * @returns {AppError}
   */
  static fromMongooseCast(mongooseError) {
    return new AppError(
      `Invalid ${mongooseError.path}: ${mongooseError.value}`,
      400,
      {
        code: "INVALID_ID",
        status: "fail",
        data: { path: mongooseError.path, value: mongooseError.value },
      },
    );
  }

  /**
   * Create an error from a JWT error
   * @param {string} message - Error message
   * @param {string} code - Error code (optional)
   * @returns {AppError}
   */
  static jwt(message = "Invalid token", code = "JWT_ERROR") {
    return new AppError(message, 401, { code, status: "fail" });
  }

  /**
   * Create an error from a JWT expired error
   * @param {string} message - Error message
   * @param {string} code - Error code (optional)
   * @returns {AppError}
   */
  static jwtExpired(message = "Your token has expired", code = "JWT_EXPIRED") {
    return new AppError(message, 401, { code, status: "fail" });
  }

  /**
   * Check if the error is a client error (4xx)
   * @returns {boolean}
   */
  isClientError() {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * Check if the error is a server error (5xx)
   * @returns {boolean}
   */
  isServerError() {
    return this.statusCode >= 500 && this.statusCode < 600;
  }

  /**
   * Convert the error to a plain object for response
   * @param {boolean} includeStack - Whether to include stack trace (development only)
   * @returns {Object}
   */
  toJSON(includeStack = false) {
    const obj = {
      status: this.status,
      message: this.message,
    };

    if (this.code) {
      obj.code = this.code;
    }

    if (this.errors) {
      obj.errors = this.errors;
    }

    if (this.data) {
      obj.data = this.data;
    }

    if (this.isOperational !== undefined) {
      obj.isOperational = this.isOperational;
    }

    if (includeStack && process.env.NODE_ENV === "development") {
      obj.stack = this.stack;
      obj.timestamp = this.timestamp;
    }

    return obj;
  }

  /**
   * Get a string representation of the error
   * @returns {string}
   */
  toString() {
    return `${this.name}: ${this.message} (${this.statusCode})`;
  }
}

export const createBadRequestError = (message, errors = null) => {
  return AppError.badRequest(message, errors);
};

export const createNotFoundError = (message = "Resource not found") => {
  return AppError.notFound(message);
};

export const createUnauthorizedError = (message = "Unauthorized") => {
  return AppError.unauthorized(message);
};

/**
 * Create a forbidden error (alias for static method)
 */
export const createForbiddenError = (message = "Forbidden") => {
  return AppError.forbidden(message);
};

/**
 * Create a conflict error (alias for static method)
 */
export const createConflictError = (
  message = "Resource already exists",
  errors = null,
) => {
  return AppError.conflict(message, errors);
};

export const createValidationError = (
  errors,
  message = "Validation failed",
) => {
  return AppError.validation(errors, message);
};

export default AppError;
