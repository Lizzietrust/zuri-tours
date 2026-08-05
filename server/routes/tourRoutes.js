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

const router = express.Router();

router.route("/top-5-cheap").get(getTopCheapTours);
router.route("/top-rated").get(getToursByRating);
router.route("/shortest").get(getToursByDuration);
router.route("/stats").get(getTourStats);
router.route("/monthly-plan/:year").get(getMonthlyPlan);
router.route("/price-range").get(getToursByPriceRange);
router.route("/difficulty/:level").get(getToursByDifficulty);
router.route("/search").get(searchTours);

router
  .route("/")
  .get(getAllTours)
  .post(protect, authorize("admin", "lead-guide"), checkTourBody, createTour);

router
  .route("/:id")
  .get(getTour)
  .put(
    protect,
    authorize("admin", "lead-guide"),
    checkValidId,
    checkTourBody,
    updateTour,
  )
  .patch(
    protect,
    authorize("admin", "lead-guide"),
    checkValidId,
    checkTourBody,
    updateTour,
  )
  .delete(protect, canDeleteTour, checkValidId, deleteTour);

router
  .route("/:id/assign-guide")
  .post(protect, hasPermission("assign:tours"), checkValidId, assignGuide);

router
  .route("/:id/assign-multiple-guides")
  .post(
    protect,
    hasPermission("assign:tours"),
    checkValidId,
    assignMultipleGuides,
  );

router
  .route("/:id/remove-guide/:guideId")
  .delete(protect, hasPermission("manage:guides"), checkValidId, removeGuide);

router
  .route("/my-assigned-tours")
  .get(protect, authorize("guide", "lead-guide"), getAssignedTours);

router.route("/:id/guide-details").get(protect, hasTourAccess, getTour);

export default router;
