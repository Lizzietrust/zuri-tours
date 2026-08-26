import express from "express";
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBookingConfirmation,
  sendCustomEmail,
  testEmail,
} from "../controllers/emailController.js";
import { protect } from "../middleware/authMiddleware.js";
import { emailLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.post("/test", emailLimiter, testEmail);

router.post("/password-reset", emailLimiter, sendPasswordResetEmail);
router.post("/welcome", protect, emailLimiter, sendWelcomeEmail);
router.post(
  "/booking-confirmation",
  protect,
  emailLimiter,
  sendBookingConfirmation,
);
router.post("/custom", protect, emailLimiter, sendCustomEmail);

export default router;
