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
} from "../controllers/tourController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
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

router.route("/").get(getAllTours);
router.route("/:id").get(checkValidId, getTour);

router.route("/").post(protect, authorize("admin"), checkTourBody, createTour);

router
  .route("/:id")
  .put(protect, authorize("admin"), checkValidId, checkTourBody, updateTour)
  .patch(protect, authorize("admin"), checkValidId, checkTourBody, updateTour)
  .delete(protect, authorize("admin"), checkValidId, deleteTour);

export default router;
