import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: "error",
    message: "Too many requests. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    status: "error",
    message: "Too many registration attempts. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: "error",
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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

export const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      status: "error",
      message: message || "Too many requests. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};
