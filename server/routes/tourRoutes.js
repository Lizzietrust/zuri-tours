import express from "express";
import {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  getTourStats,
  getMonthlyPlan,
  getToursByPriceRange,
  getTopCheapTours,
  getToursByDifficulty,
  getToursByDuration,
  getToursByRating,
  searchTours,
  assignGuide,
  assignMultipleGuides,
  removeGuide,
  getAssignedTours,
  getTourWithReviews,
  setLeadGuide,
  getGuideDetails,
  addGuideRating,
} from "../controllers/tourController.js";
import {
  protect,
  authorize,
  hasPermission,
  hasTourAccess,
  canDeleteTour,
} from "../middleware/authMiddleware.js";
import {
  checkValidId,
  checkTourBody,
} from "../middleware/validationMiddleware.js";
import {
  tourCreationLimiter,
  userUpdateLimiter,
} from "../middleware/rateLimitMiddleware.js";

import reviewRouter from "./reviewRoutes.js";

const router = express.Router();

router.use("/:tourId/reviews", reviewRouter);

router.route("/top-5-cheap").get(getTopCheapTours);
router.route("/top-rated").get(getToursByRating);
router.route("/shortest").get(getToursByDuration);
router.route("/stats").get(getTourStats);
router.route("/monthly-plan/:year").get(getMonthlyPlan);
router.route("/price-range").get(getToursByPriceRange);
router.route("/difficulty/:level").get(getToursByDifficulty);
router.route("/search").get(searchTours);

router.route("/:id/reviews").get(getTourWithReviews);

router
  .route("/")
  .get(getAllTours)
  .post(
    protect,
    authorize("admin", "lead-guide"),
    tourCreationLimiter,
    checkTourBody,
    createTour,
  );

router
  .route("/:id")
  .get(getTour)
  .put(
    protect,
    authorize("admin", "lead-guide"),
    checkValidId,
    userUpdateLimiter,
    checkTourBody,
    updateTour,
  )
  .patch(
    protect,
    authorize("admin", "lead-guide"),
    checkValidId,
    userUpdateLimiter,
    checkTourBody,
    updateTour,
  )
  .delete(protect, canDeleteTour, checkValidId, deleteTour);

router
  .route("/:id/assign-guide")
  .post(
    protect,
    hasPermission("assign:tours"),
    checkValidId,
    userUpdateLimiter,
    assignGuide,
  );

router
  .route("/:id/assign-multiple-guides")
  .post(
    protect,
    hasPermission("assign:tours"),
    checkValidId,
    userUpdateLimiter,
    assignMultipleGuides,
  );

router
  .route("/:id/remove-guide/:guideId")
  .delete(
    protect,
    hasPermission("manage:guides"),
    checkValidId,
    userUpdateLimiter,
    removeGuide,
  );

router
  .route("/:id/set-lead-guide")
  .patch(
    protect,
    hasPermission("manage:guides"),
    checkValidId,
    userUpdateLimiter,
    setLeadGuide,
  );

router
  .route("/:id/guide-details/:guideId")
  .get(protect, hasTourAccess, getGuideDetails);

router
  .route("/:id/guide-rating")
  .post(protect, hasTourAccess, userUpdateLimiter, addGuideRating);

router
  .route("/my-assigned-tours")
  .get(protect, authorize("guide", "lead-guide"), getAssignedTours);

export default router;
