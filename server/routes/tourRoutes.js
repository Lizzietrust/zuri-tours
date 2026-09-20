import express from "express";
import {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  softDeleteTour,
  restoreTour,
  permanentDeleteTour,
  bulkDeleteTours,
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
  // ----- geospatial handlers -----
  getToursWithin,
  getToursNear,
  getDistanceFromTour,
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
  validateGeospatialParams,
} from "../middleware/validationMiddleware.js";
import {
  tourCreationLimiter,
  userUpdateLimiter,
} from "../middleware/rateLimitMiddleware.js";

import reviewRouter from "./reviewRoutes.js";

const router = express.Router();

/* ============================================================
   NESTED ROUTES (must be first so /:tourId/reviews wins)
   ============================================================ */

router.use("/:tourId/reviews", reviewRouter);

/* ============================================================
   PUBLIC ROUTES (read-only discovery)
   ============================================================ */

router.route("/top-5-cheap").get(getTopCheapTours);
router.route("/top-rated").get(getToursByRating);
router.route("/shortest").get(getToursByDuration);
router.route("/price-range").get(getToursByPriceRange);
router.route("/difficulty/:level").get(getToursByDifficulty);
router.route("/search").get(searchTours);

/* ============================================================
   GEOSPATIAL ROUTES
   (MUST be declared before /:id to avoid being shadowed)
   ============================================================ */

/**
 * Radius search with path params.
 *   GET /tours/within/50/center/40.7128,-74.0060/unit/km
 *
 * Optional query params: difficulty, category, minPrice, maxPrice,
 * page, limit, populateReviews, populateGuides.
 */
router
  .route("/within/:distance/center/:latlng/unit/:unit")
  .get(validateGeospatialParams, getToursWithin);

/**
 * Radius search with query-string params (friendlier for JS clients).
 *   GET /tours/near?lat=40.7128&lng=-74.0060&distance=50&unit=km
 */
router.route("/near").get(getToursNear);

/* ============================================================
   AUTHENTICATED NON-ADMIN ROUTES
   (MUST be declared before /:id to avoid being shadowed)
   ============================================================ */

router
  .route("/my-assigned-tours")
  .get(protect, authorize("guide", "lead-guide"), getAssignedTours);

/* ============================================================
   ADMIN / LEAD-GUIDE STATS & PLANS
   ============================================================ */

router.route("/stats").get(protect, hasPermission("view:stats"), getTourStats);

router
  .route("/monthly-plan/:year")
  .get(protect, hasPermission("view:stats"), getMonthlyPlan);

/* ============================================================
   MAIN COLLECTION
   ============================================================ */

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

/* ============================================================
   BULK ACTIONS (declared before /:id)
   ============================================================ */

router
  .route("/bulk/delete")
  .delete(protect, authorize("admin"), bulkDeleteTours);

/* ============================================================
   SINGLE TOUR
   ============================================================ */

router
  .route("/:id")
  .get(getTour)
  .patch(
    protect,
    authorize("admin", "lead-guide"),
    checkValidId,
    userUpdateLimiter,
    checkTourBody,
    updateTour,
  )
  .delete(protect, canDeleteTour, checkValidId, deleteTour);

/* ============================================================
   SOFT DELETE / RESTORE / PERMANENT
   ============================================================ */

router
  .route("/:id/soft-delete")
  .patch(
    protect,
    authorize("admin", "lead-guide"),
    checkValidId,
    softDeleteTour,
  );

router
  .route("/:id/restore")
  .patch(protect, authorize("admin"), checkValidId, restoreTour);

router
  .route("/:id/permanent")
  .delete(protect, authorize("admin"), checkValidId, permanentDeleteTour);

/* ============================================================
   REVIEWS FOR A SINGLE TOUR
   ============================================================ */

router.route("/:id/reviews").get(getTourWithReviews);

/* ============================================================
   GEOSPATIAL — DISTANCE FROM A SINGLE TOUR
   ============================================================ */

router
  .route("/:id/distance-to/:latlng/unit/:unit")
  .get(validateGeospatialParams, getDistanceFromTour);

/* ============================================================
   GUIDE MANAGEMENT
   ============================================================ */

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

export default router;
