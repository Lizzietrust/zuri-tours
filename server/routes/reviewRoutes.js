import express from "express";
import {
  createReview,
  getAllReviews,
  getReview,
  updateReview,
  deleteReview,
  permanentDeleteReview,
  restoreReview,
  bulkDeleteReviews,
  markHelpful,
  addReviewResponse,
  approveReview,
  rejectReview,
  flagReview,
  getReviewStats,
  getMyReviews,
  getTourReviews,
  getBatchTourReviews,
  getMyReviewForTour,
  updateMyReview,
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

/* ---------- Current user's own review for a specific tour ---------- */

router
  .route("/me/:tourId")
  .get(protect, getMyReviewForTour)
  .patch(protect, userUpdateLimiter, validateReview, updateMyReview);

/* ---------- Root ---------- */

router
  .route("/")
  .get(getAllReviews)
  .post(protect, reviewCreationLimiter, validateReview, createReview);

/* ---------- Single review ---------- */

router
  .route("/:id")
  .get(getReview)
  .patch(protect, checkValidId, userUpdateLimiter, validateReview, updateReview)
  .delete(protect, checkValidId, deleteReview);

/* ---------- Custom routes (order matters!) ---------- */

router.route("/stats").get(getReviewStats);
router.route("/public").get(getTourReviews);
router.route("/my-reviews").get(protect, getMyReviews);
router.route("/batch").post(protect, authorize("admin"), getBatchTourReviews);

/* ---------- Actions on a specific review ---------- */

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

router
  .route("/:id/permanent")
  .delete(protect, authorize("admin"), checkValidId, permanentDeleteReview);

router
  .route("/:id/restore")
  .patch(protect, authorize("admin"), checkValidId, restoreReview);

/* ---------- Bulk ---------- */

router
  .route("/bulk/delete")
  .delete(protect, authorize("admin"), bulkDeleteReviews);

export default router;
