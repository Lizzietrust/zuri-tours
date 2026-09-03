import rateLimit from "express-rate-limit";

/**
 * Create a custom rate limiter with consistent response format
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum number of requests
 * @param {string} message - Custom error message
 * @param {Object} options - Additional rate limiter options
 * @returns {Function} Express rate limiter middleware
 */
export const createRateLimiter = (
  windowMs,
  max,
  message = "Too many requests. Please try again later.",
  options = {},
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      status: "error",
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
};

/**
 * Create a rate limiter with skip successful requests option
 * Useful for login attempts where only failed attempts should count
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum number of failed attempts
 * @param {string} message - Custom error message
 * @param {Object} options - Additional rate limiter options
 * @returns {Function} Express rate limiter middleware
 */
export const createFailedAttemptLimiter = (
  windowMs,
  max,
  message = "Too many failed attempts. Please try again later.",
  options = {},
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      status: "error",
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    ...options,
  });
};

/**
 * Create a rate limiter with custom key generator
 * Useful for rate limiting by user ID instead of IP
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum number of requests
 * @param {string} message - Custom error message
 * @param {Object} options - Additional rate limiter options
 * @returns {Function} Express rate limiter middleware
 */
export const createUserRateLimiter = (
  windowMs,
  max,
  message = "Too many requests. Please try again later.",
  options = {},
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      status: "error",
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.user?.id || req.ip;
    },
    ...options,
  });
};

/**
 * Create a rate limiter that skips for authenticated users
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum number of requests
 * @param {string} message - Custom error message
 * @param {Object} options - Additional rate limiter options
 * @returns {Function} Express rate limiter middleware
 */
export const createSkipAuthLimiter = (
  windowMs,
  max,
  message = "Too many requests. Please try again later.",
  options = {},
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      status: "error",
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return !!req.user;
    },
    ...options,
  });
};

/**
 * Create a rate limiter that only applies to authenticated users
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum number of requests
 * @param {string} message - Custom error message
 * @param {Object} options - Additional rate limiter options
 * @returns {Function} Express rate limiter middleware
 */
export const createAuthOnlyLimiter = (
  windowMs,
  max,
  message = "Too many requests. Please try again later.",
  options = {},
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      status: "error",
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.user?.id || req.ip;
    },
    skip: (req) => {
      return !req.user;
    },
    ...options,
  });
};

export const createPerUserLimiter = (windowMs, max, message) => {
  return createUserRateLimiter(windowMs, max, message);
};

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: "error",
    message: "Too many requests. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = generalLimiter;

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    status: "error",
    message: "Too many registration attempts. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    status: "error",
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictLoginLimiter = createFailedAttemptLimiter(
  15 * 60 * 1000,
  5,
  "Too many failed login attempts. Please try again in 15 minutes.",
);

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    status: "error",
    message:
      "Too many password reset attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    status: "error",
    message: "Too many email requests. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    status: "error",
    message: "Too many password change attempts. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const tourCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    status: "error",
    message: "Too many tour creation requests. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const tourUpdateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: {
    status: "error",
    message: "Too many tour update requests. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const tourDeletionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    status: "error",
    message: "Too many tour deletion requests. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const reviewCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    status: "error",
    message: "Too many review creation attempts. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const reviewUpdateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: {
    status: "error",
    message: "Too many review update requests. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const userUpdateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: {
    status: "error",
    message: "Too many update requests. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const profileUpdateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    status: "error",
    message: "Too many profile update requests. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: {
    status: "error",
    message: "Too many search requests. Please try again in 1 minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const advancedSearchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    status: "error",
    message: "Too many advanced search requests. Please try again in 1 minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: {
    status: "error",
    message: "Too many admin operations. Please try again in 1 minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const bulkOperationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    status: "error",
    message: "Too many bulk operations. Please try again in 1 minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    status: "error",
    message:
      "Too many requests for this sensitive operation. Please try again in 1 minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==================== RATE LIMITER WITH SKIP OPTIONS ====================

/**
 * Rate limiter that skips for authenticated users
 */
export const skipAuthLimiter = createSkipAuthLimiter(
  60 * 1000, // 1 minute
  20,
  "Too many requests. Please login to continue.",
);

/**
 * Rate limiter that only applies to authenticated users
 */
export const authOnlyLimiter = createAuthOnlyLimiter(
  60 * 1000, // 1 minute
  10,
  "Too many requests for authenticated users.",
);

// ==================== EXPORT ALL ====================

export default {
  // Core factories
  createRateLimiter,
  createFailedAttemptLimiter,
  createUserRateLimiter,
  createPerUserLimiter,
  createSkipAuthLimiter,
  createAuthOnlyLimiter,

  // General
  generalLimiter,
  apiLimiter,

  // Auth
  registerLimiter,
  loginLimiter,
  strictLoginLimiter,
  resetPasswordLimiter,
  emailLimiter,
  passwordChangeLimiter,

  // Tours
  tourCreationLimiter,
  tourUpdateLimiter,
  tourDeletionLimiter,

  // Reviews
  reviewCreationLimiter,
  reviewUpdateLimiter,

  // Users
  userUpdateLimiter,
  profileUpdateLimiter,

  // Search
  searchLimiter,
  advancedSearchLimiter,

  // Admin
  adminLimiter,
  bulkOperationLimiter,

  // Strict
  strictLimiter,

  // Conditional
  skipAuthLimiter,
  authOnlyLimiter,
};
