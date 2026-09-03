import express from "express";
import {
  createReview,
  getAllReviews,
  getReview,
  updateReview,
  deleteReview,
  markHelpful,
  addReviewResponse,
  approveReview,
  rejectReview,
  flagReview,
  getReviewStats,
  getMyReviews,
  getTourReviews,
  getBatchTourReviews,
} from "../controllers/reviewController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  checkValidId,
  validateReview,
} from "../middleware/validationMiddleware.js";
import {
  reviewCreationLimiter,
  userUpdateLimiter,
} from "../middleware/rateLimitMiddleware.js";

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(getAllReviews)
  .post(protect, reviewCreationLimiter, validateReview, createReview);

router.route("/stats").get(getReviewStats);

router.route("/public").get(getTourReviews);

router
  .route("/:id")
  .get(getReview)
  .patch(protect, checkValidId, userUpdateLimiter, validateReview, updateReview)
  .delete(protect, checkValidId, deleteReview);

router
  .route("/:id/helpful")
  .patch(protect, checkValidId, userUpdateLimiter, markHelpful);

router
  .route("/:id/response")
  .post(protect, checkValidId, userUpdateLimiter, addReviewResponse);

router
  .route("/:id/approve")
  .patch(
    protect,
    authorize("admin"),
    checkValidId,
    userUpdateLimiter,
    approveReview,
  );

router
  .route("/:id/reject")
  .patch(
    protect,
    authorize("admin"),
    checkValidId,
    userUpdateLimiter,
    rejectReview,
  );

router
  .route("/:id/flag")
  .post(protect, checkValidId, userUpdateLimiter, flagReview);

router.route("/my-reviews").get(protect, getMyReviews);

router.route("/batch").post(protect, authorize("admin"), getBatchTourReviews);

export default router;
