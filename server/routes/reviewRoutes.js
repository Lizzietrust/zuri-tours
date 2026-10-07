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

/**
 * `mergeParams: true` lets this router see params from the parent router,
 * so when mounted as `router.use("/:tourId/reviews", reviewRouter)`, the
 * `:tourId` is available inside these routes as `req.params.tourId`.
 */
const router = express.Router({ mergeParams: true });

/* ============================================================
   STATIC / NAMED ROUTES — MUST come before /:id
   ============================================================ */

/* ---------- Current user's own review for a specific tour ---------- */

router
  .route("/me/:tourId")
  .get(protect, getMyReviewForTour)
  .patch(protect, userUpdateLimiter, updateMyReview);

/* ---------- Current user's own reviews (all tours) ---------- */

router.route("/my-reviews").get(protect, getMyReviews);

/* ---------- Tour-scoped custom routes ---------- */

/**
 * ✅ FIXED: `getReviewStats` needs a tourId. This route works when the
 * router is mounted as `/tours/:tourId/reviews/stats` (mergeParams).
 * If mounted at `/reviews/stats`, callers must pass `?tourId=...`.
 */
router.route("/stats").get(getReviewStats);

/**
 * ✅ FIXED: same as above — public tour reviews require a tourId.
 */
router.route("/public").get(getTourReviews);

/* ---------- Batch (admin only) ---------- */

router.route("/batch").post(protect, authorize("admin"), getBatchTourReviews);

/* ---------- Root collection ---------- */

router
  .route("/")
  .get(getAllReviews)
  .post(protect, reviewCreationLimiter, validateReview, createReview);

/* ---------- Bulk (static, so before /:id) ---------- */

router
  .route("/bulk/delete")
  .delete(protect, authorize("admin"), bulkDeleteReviews);

/* ============================================================
   PARAM ROUTES — /:id must come LAST
   ============================================================ */

router
  .route("/:id")
  .get(getReview)

  .patch(protect, checkValidId, userUpdateLimiter, updateReview)
  .delete(protect, checkValidId, deleteReview);

/* ---------- Actions on a specific review ---------- */

router
  .route("/:id/helpful")
  .patch(protect, checkValidId, userUpdateLimiter, markHelpful);

router
  .route("/:id/response")
  .post(protect, checkValidId, userUpdateLimiter, addReviewResponse);

/**
 * ✅ Admin moderation — uses the model-method handlers in
 * reviewController.js (`review.approve()` / `review.reject()`),
 * which also recalculate tour averages.
 */
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

/* ---------- Admin recovery ---------- */

router
  .route("/:id/permanent")
  .delete(protect, authorize("admin"), checkValidId, permanentDeleteReview);

router
  .route("/:id/restore")
  .patch(protect, authorize("admin"), checkValidId, restoreReview);

export default router;
