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
} from "../controllers/reviewController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router.get("/", getTourReviews);
router.get("/stats", getReviewStats);

router.use(protect);

router.post("/", createReview);
router.get("/my-reviews", getMyReviews);
router.get("/:id", getReview);
router.patch("/:id", updateReview);
router.delete("/:id", deleteReview);

router.patch("/:id/helpful", markHelpful);
router.patch("/:id/response", addReviewResponse);
router.patch("/:id/flag", flagReview);

router.patch("/:id/approve", authorize("admin"), approveReview);
router.patch("/:id/reject", authorize("admin"), rejectReview);

router.get("/admin/all", authorize("admin"), getAllReviews);

export default router;
