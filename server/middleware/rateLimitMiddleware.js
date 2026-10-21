import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/* ============================================================
   DEV MODE DETECTION
   ============================================================
   In development we skip rate limiting entirely. It only hurts:
   - React Strict Mode double-renders → 2x requests
   - TanStack Query refetch on window focus → more requests
   - Hot reloads fire requests faster than a real user
   - You burn 100 requests in 30 seconds without doing anything

   In production every limiter below is active and identical to
   before. No behavior change when NODE_ENV === "production".
   ============================================================ */
const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Wrapper around `rateLimit()` that returns a no-op middleware in dev.
 * Usage: `const limiter = createLimiter({ windowMs, max, message });`
 * In prod → real limiter. In dev → `(req, res, next) => next()`.
 */
function createLimiter(config) {
  if (IS_DEV) {
    return (req, res, next) => next();
  }

  return rateLimit(config);
}

/* ============================================================
   FACTORY FUNCTIONS
   ============================================================ */

export const createRateLimiter = (
  windowMs,
  max,
  message = "Too many requests. Please try again later.",
  options = {},
) => {
  if (IS_DEV) return (req, res, next) => next();

  return rateLimit({
    windowMs,
    max,
    message: { status: "error", message },
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
};

export const createFailedAttemptLimiter = (
  windowMs,
  max,
  message = "Too many failed attempts. Please try again later.",
  options = {},
) => {
  if (IS_DEV) return (req, res, next) => next();

  return rateLimit({
    windowMs,
    max,
    message: { status: "error", message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    ...options,
  });
};

export const createUserRateLimiter = (
  windowMs,
  max,
  message = "Too many requests. Please try again later.",
  options = {},
) => {
  if (IS_DEV) return (req, res, next) => next();

  return rateLimit({
    windowMs,
    max,
    message: { status: "error", message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
    ...options,
  });
};

export const createSkipAuthLimiter = (
  windowMs,
  max,
  message = "Too many requests. Please try again later.",
  options = {},
) => {
  if (IS_DEV) return (req, res, next) => next();

  return rateLimit({
    windowMs,
    max,
    message: { status: "error", message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => !!req.user,
    ...options,
  });
};

export const createAuthOnlyLimiter = (
  windowMs,
  max,
  message = "Too many requests. Please try again later.",
  options = {},
) => {
  if (IS_DEV) return (req, res, next) => next();

  return rateLimit({
    windowMs,
    max,
    message: { status: "error", message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
    skip: (req) => !req.user,
    ...options,
  });
};

export const createPerUserLimiter = (windowMs, max, message) =>
  createUserRateLimiter(windowMs, max, message);

/* ============================================================
   PRE-CONFIGURED LIMITERS
   ============================================================ */

export const generalLimiter = createLimiter({
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

export const registerLimiter = createLimiter({
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

export const loginLimiter = createLimiter({
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

export const resetPasswordLimiter = createLimiter({
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

export const emailLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    status: "error",
    message: "Too many email requests. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const passwordChangeLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    status: "error",
    message: "Too many password change attempts. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const tourCreationLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    status: "error",
    message: "Too many tour creation requests. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const tourUpdateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: {
    status: "error",
    message: "Too many tour update requests. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const tourDeletionLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    status: "error",
    message: "Too many tour deletion requests. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const reviewCreationLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    status: "error",
    message: "Too many review creation attempts. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const reviewUpdateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: {
    status: "error",
    message: "Too many review update requests. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const userUpdateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: {
    status: "error",
    message: "Too many update requests. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const profileUpdateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    status: "error",
    message: "Too many profile update requests. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const searchLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 50,
  message: {
    status: "error",
    message: "Too many search requests. Please try again in 1 minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const advancedSearchLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    status: "error",
    message: "Too many advanced search requests. Please try again in 1 minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const adminLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 50,
  message: {
    status: "error",
    message: "Too many admin operations. Please try again in 1 minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const bulkOperationLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    status: "error",
    message: "Too many bulk operations. Please try again in 1 minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    status: "error",
    message:
      "Too many requests for this sensitive operation. Please try again in 1 minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ============================================================
   COMPOSED LIMITERS
   ============================================================ */

export const skipAuthLimiter = createSkipAuthLimiter(
  60 * 1000,
  20,
  "Too many requests. Please login to continue.",
);

export const authOnlyLimiter = createAuthOnlyLimiter(
  60 * 1000,
  10,
  "Too many requests for authenticated users.",
);

/* ============================================================
   DEFAULT EXPORT
   ============================================================ */

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
