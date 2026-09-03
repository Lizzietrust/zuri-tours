/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {*} data - Data to send
 * @param {Object} meta - Additional metadata (optional)
 */
export const sendSuccessResponse = (
  res,
  statusCode,
  message,
  data,
  meta = {},
) => {
  const response = {
    status: "success",
    message,
  };

  if (data !== undefined && data !== null) {
    response.data = data;
  }

  if (meta && Object.keys(meta).length > 0) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a success response with simplified params
 * @param {Object} res - Express response object
 * @param {*} data - Data to send
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message (default: "Success")
 */
export const sendSuccess = (
  res,
  data,
  statusCode = 200,
  message = "Success",
) => {
  return sendSuccessResponse(res, statusCode, message, data);
};

/**
 * Send a paginated success response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination metadata
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message (default: "Success")
 * @param {string} dataKey - Key name for data (default: "items")
 */
export const sendPaginationSuccess = (
  res,
  data,
  pagination,
  statusCode = 200,
  message = "Success",
  dataKey = "items",
) => {
  const response = {
    status: "success",
    message,
    results: data ? data.length : 0,
    pagination,
    data: {
      [dataKey]: data,
    },
  };

  return res.status(statusCode).json(response);
};

/**
 * Send a created response (201)
 * @param {Object} res - Express response object
 * @param {*} data - Data to send
 * @param {string} message - Success message (default: "Resource created successfully")
 */
export const sendCreated = (
  res,
  data,
  message = "Resource created successfully",
) => {
  return sendSuccessResponse(res, 201, message, data);
};

/**
 * Send a no content response (204)
 * @param {Object} res - Express response object
 */
export const sendNoContent = (res) => {
  return res.status(204).json({
    status: "success",
    data: null,
  });
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object|Error} error - Additional error details (optional)
 * @param {Object} errors - Validation errors (optional)
 */
export const sendErrorResponse = (
  res,
  statusCode,
  message,
  error = null,
  errors = null,
) => {
  const response = {
    status: "error",
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  if (error && process.env.NODE_ENV === "development") {
    const errorDetails = {
      name: error.name || "Error",
      message: error.message || message,
    };

    if (error.stack) {
      errorDetails.stack = error.stack;
    }

    if (error.code) {
      errorDetails.code = error.code;
    }
    if (error.path) {
      errorDetails.path = error.path;
    }
    if (error.value) {
      errorDetails.value = error.value;
    }
    if (error.keyPattern) {
      errorDetails.keyPattern = error.keyPattern;
    }
    if (error.keyValue) {
      errorDetails.keyValue = error.keyValue;
    }
    if (error.errors) {
      errorDetails.validationErrors = error.errors;
    }

    response.error = errorDetails;

    if (error.isOperational !== undefined) {
      response.isOperational = error.isOperational;
    }
    if (error.status) {
      response.errorStatus = error.status;
    }
  }

  if (process.env.NODE_ENV === "production") {
    if (errors) {
      response.errors = errors;
    }

    if (error && error.isOperational !== undefined) {
      response.isOperational = error.isOperational;
    }
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response with simplified params
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {number} statusCode - HTTP status code (default: 500)
 */
export const sendError = (res, error, statusCode = 500) => {
  return sendErrorResponse(
    res,
    statusCode,
    error.message || "Something went wrong",
    error,
  );
};

/**
 * Send a bad request response (400)
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: "Bad request")
 * @param {Object} errors - Validation errors (optional)
 */
export const sendBadRequest = (res, message = "Bad request", errors = null) => {
  return sendErrorResponse(res, 400, message, null, errors);
};

/**
 * Send a validation error response (400)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Object} errors - Validation errors (optional)
 */
export const sendValidationErrorResponse = (res, message, errors = null) => {
  return sendErrorResponse(res, 400, message, null, errors);
};

/**
 * Send an unauthorized response (401)
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: "Unauthorized")
 */
export const sendUnauthorizedResponse = (res, message = "Unauthorized") => {
  return sendErrorResponse(res, 401, message);
};

/**
 * Send an unauthorized response (401) - alias
 */
export const sendUnauthorized = (res, message = "Unauthorized") => {
  return sendUnauthorizedResponse(res, message);
};

/**
 * Send a forbidden response (403)
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: "Forbidden")
 */
export const sendForbiddenResponse = (res, message = "Forbidden") => {
  return sendErrorResponse(res, 403, message);
};

/**
 * Send a forbidden response (403) - alias
 */
export const sendForbidden = (res, message = "Forbidden") => {
  return sendForbiddenResponse(res, message);
};

/**
 * Send a not found response (404)
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: "Resource not found")
 */
export const sendNotFoundResponse = (res, message = "Resource not found") => {
  return sendErrorResponse(res, 404, message);
};

/**
 * Send a not found response (404) - alias
 */
export const sendNotFound = (res, message = "Resource not found") => {
  return sendNotFoundResponse(res, message);
};

/**
 * Send a conflict response (409)
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: "Resource already exists")
 */
export const sendConflictResponse = (
  res,
  message = "Resource already exists",
) => {
  return sendErrorResponse(res, 409, message);
};

/**
 * Send a too many requests response (429)
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: "Too many requests")
 */
export const sendTooManyRequestsResponse = (
  res,
  message = "Too many requests, please try again later",
) => {
  return sendErrorResponse(res, 429, message);
};

/**
 * Send an internal server error response (500)
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: "Internal server error")
 * @param {Error} error - Error object (optional)
 */
export const sendInternalServerError = (
  res,
  message = "Internal server error",
  error = null,
) => {
  return sendErrorResponse(res, 500, message, error);
};

/**
 * Send a tour success response with consistent format
 * @param {Object} res - Express response object
 * @param {*} tour - Tour data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message (default: "Tour fetched successfully")
 */
export const sendTourResponse = (
  res,
  tour,
  statusCode = 200,
  message = "Tour fetched successfully",
) => {
  return sendSuccessResponse(res, statusCode, message, { tour });
};

/**
 * Send tours list response with pagination
 * @param {Object} res - Express response object
 * @param {Array} tours - Array of tours
 * @param {Object} pagination - Pagination metadata
 * @param {number} count - Total count
 * @param {string} message - Success message (default: "Tours fetched successfully")
 */
export const sendToursListResponse = (
  res,
  tours,
  pagination,
  count,
  message = "Tours fetched successfully",
) => {
  return sendSuccessResponse(
    res,
    200,
    message,
    { tours },
    {
      results: count || tours.length,
      pagination,
    },
  );
};

/**
 * Send a review success response with consistent format
 * @param {Object} res - Express response object
 * @param {*} review - Review data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message (default: "Review fetched successfully")
 */
export const sendReviewResponse = (
  res,
  review,
  statusCode = 200,
  message = "Review fetched successfully",
) => {
  return sendSuccessResponse(res, statusCode, message, { review });
};

/**
 * Send reviews list response with pagination
 * @param {Object} res - Express response object
 * @param {Array} reviews - Array of reviews
 * @param {Object} stats - Review statistics
 * @param {Object} pagination - Pagination metadata
 * @param {number} total - Total count
 * @param {string} message - Success message (default: "Reviews fetched successfully")
 */
export const sendReviewsListResponse = (
  res,
  reviews,
  stats = null,
  pagination = null,
  total = null,
  message = "Reviews fetched successfully",
) => {
  const response = {
    status: "success",
    message,
    results: reviews ? reviews.length : 0,
    data: { reviews },
  };

  if (stats) {
    response.data.stats = stats;
  }

  if (pagination) {
    response.pagination = pagination;
  }

  if (total !== null) {
    response.total = total;
  }

  return res.status(200).json(response);
};

/**
 * Send a user success response with consistent format
 * @param {Object} res - Express response object
 * @param {*} user - User data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message (default: "User fetched successfully")
 */
export const sendUserResponse = (
  res,
  user,
  statusCode = 200,
  message = "User fetched successfully",
) => {
  return sendSuccessResponse(res, statusCode, message, { user });
};

/**
 * Send users list response with pagination
 * @param {Object} res - Express response object
 * @param {Array} users - Array of users
 * @param {Object} pagination - Pagination metadata
 * @param {string} message - Success message (default: "Users fetched successfully")
 */
export const sendUsersListResponse = (
  res,
  users,
  pagination = null,
  message = "Users fetched successfully",
) => {
  const response = {
    status: "success",
    message,
    results: users ? users.length : 0,
    data: { users },
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(200).json(response);
};

/**
 * Send a statistics response
 * @param {Object} res - Express response object
 * @param {Object} stats - Statistics data
 * @param {string} message - Success message (default: "Statistics fetched successfully")
 */
export const sendStatsResponse = (
  res,
  stats,
  message = "Statistics fetched successfully",
) => {
  return sendSuccessResponse(res, 200, message, stats);
};

/**
 * Send a bulk operation response
 * @param {Object} res - Express response object
 * @param {Object} result - Bulk operation result
 * @param {string} message - Success message (default: "Bulk operation completed successfully")
 */
export const sendBulkOperationResponse = (
  res,
  result,
  message = "Bulk operation completed successfully",
) => {
  return sendSuccessResponse(res, 200, message, result);
};

/**
 * Send an authentication response with token
 * @param {Object} res - Express response object
 * @param {Object} user - User data
 * @param {string} token - JWT token
 * @param {string} message - Success message (default: "Authentication successful")
 */
export const sendAuthResponse = (
  res,
  user,
  token,
  message = "Authentication successful",
) => {
  return sendSuccessResponse(res, 200, message, {
    user,
    token,
  });
};

/**
 * Send a custom response with any status code
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} status - Response status (success/error/fail)
 * @param {string} message - Response message
 * @param {*} data - Data to send
 * @param {Object} meta - Additional metadata
 */
export const sendCustomResponse = (
  res,
  statusCode,
  status,
  message,
  data = null,
  meta = {},
) => {
  const response = {
    status,
    message,
  };

  if (data !== undefined && data !== null) {
    response.data = data;
  }

  if (meta && Object.keys(meta).length > 0) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a response with success:false format (legacy support)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 */
export const sendFailResponse = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
};

/**
 * Send a response with success:true format (legacy support)
 * @param {Object} res - Express response object
 * @param {*} data - Data to send
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccessLegacy = (
  res,
  data,
  message = "Success",
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export default {
  sendSuccessResponse,
  sendSuccess,
  sendPaginationSuccess,

  sendCreated,
  sendNoContent,

  sendErrorResponse,
  sendError,
  sendBadRequest,
  sendValidationErrorResponse,
  sendUnauthorizedResponse,
  sendUnauthorized,
  sendForbiddenResponse,
  sendForbidden,
  sendNotFoundResponse,
  sendNotFound,
  sendConflictResponse,
  sendTooManyRequestsResponse,
  sendInternalServerError,

  sendTourResponse,
  sendToursListResponse,

  sendReviewResponse,
  sendReviewsListResponse,

  sendUserResponse,
  sendUsersListResponse,

  sendStatsResponse,

  sendBulkOperationResponse,

  sendAuthResponse,

  sendCustomResponse,
  sendFailResponse,
  sendSuccessLegacy,
};
