import express from "express";
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBookingConfirmation,
  sendCustomEmail,
  testEmail,
} from "../controllers/emailController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/test", testEmail);
router.post("/password-reset", sendPasswordResetEmail);

router.post("/welcome", protect, sendWelcomeEmail);
router.post("/booking-confirmation", protect, sendBookingConfirmation);
router.post("/custom", protect, sendCustomEmail);

export default router;
