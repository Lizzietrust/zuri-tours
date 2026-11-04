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
  flagReview,
  getReviewStats,
  getMyReviews,
  getTourReviews,
  getBatchTourReviews,
  getMyReviewForTour,
  updateMyReview,
  adminGetAllReviews,
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

/* ---------- Static / named routes (before /:id) ---------- */
router
  .route("/me/:tourId")
  .get(protect, getMyReviewForTour)
  .patch(protect, userUpdateLimiter, updateMyReview);

router.route("/my-reviews").get(protect, getMyReviews);
router.route("/stats").get(getReviewStats);
router.route("/public").get(getTourReviews);

/* ---------- Admin ---------- */
router.route("/admin/all").get(protect, authorize("admin"), adminGetAllReviews);
router.route("/batch").post(protect, authorize("admin"), getBatchTourReviews);
router
  .route("/bulk/delete")
  .delete(protect, authorize("admin"), bulkDeleteReviews);

/* ---------- Root collection ---------- */
router
  .route("/")
  .get(getAllReviews)
  .post(protect, reviewCreationLimiter, validateReview, createReview);

/* ---------- Param routes (LAST) ---------- */
router
  .route("/:id")
  .get(getReview)
  .patch(protect, checkValidId, userUpdateLimiter, updateReview)
  .delete(protect, checkValidId, deleteReview);

router
  .route("/:id/helpful")
  .patch(protect, checkValidId, userUpdateLimiter, markHelpful);
router
  .route("/:id/response")
  .post(protect, checkValidId, userUpdateLimiter, addReviewResponse);
router
  .route("/:id/flag")
  .post(protect, checkValidId, userUpdateLimiter, flagReview);

router
  .route("/:id/restore")
  .patch(protect, authorize("admin"), checkValidId, restoreReview);
router
  .route("/:id/permanent")
  .delete(protect, authorize("admin"), checkValidId, permanentDeleteReview);

export default router;
