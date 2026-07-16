import express from "express";
import {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  getTourStats,
} from "../controllers/tourController.js";

const router = express.Router();

router.get("/stats", getTourStats);

router.route("/").get(getAllTours).post(createTour);

router.route("/:id").get(getTour).put(updateTour).delete(deleteTour);

export default router;
