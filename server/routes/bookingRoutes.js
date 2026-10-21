import express from "express";
import {
  initializeBooking,
  verifyBookingPayment,
  paystackWebhook,
  getMyBookings,
  getBooking,
  cancelBooking,
  getAllBookings,
} from "../controllers/bookingController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { checkValidId } from "../middleware/validationMiddleware.js";
import { userUpdateLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

/* ---------- Public webhook (NO auth — Paystack calls this) ---------- */
router.post("/webhook/paystack", express.json(), paystackWebhook);

/* ---------- Everything below requires authentication ---------- */
router.use(protect);

router.route("/").post(userUpdateLimiter, initializeBooking);

router.route("/me").get(getMyBookings);

router.route("/verify/:reference").get(verifyBookingPayment);

router.route("/:id").get(checkValidId, getBooking);

router.route("/:id/cancel").patch(checkValidId, cancelBooking);

router.route("/").get(authorize("admin"), getAllBookings);

export default router;
