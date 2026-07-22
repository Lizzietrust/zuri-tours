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
} from "../controllers/tourController.js";

const router = express.Router();

router.get("/stats", getTourStats);
router.get("/monthly-plan/:year", getMonthlyPlan);
router.get("/top-5-cheap", getTopCheapTours);
router.get("/price-range", getToursByPriceRange);
router.get("/difficulty/:level", getToursByDifficulty);

router.route("/").get(getAllTours).post(createTour);

router.route("/:id").get(getTour).put(updateTour).delete(deleteTour);

export default router;
