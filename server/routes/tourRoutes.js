import express from "express";

const router = express.Router();

// Import your controller functions (you'll need to create these)
import {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
} from "../controllers/tourController.js";

// Route definitions
router
  .route("/")
  .get(getAllTours) // GET /api/v1/tours
  .post(createTour); // POST /api/v1/tours

router
  .route("/:id")
  .get(getTour) // GET /api/v1/tours/:id
  .patch(updateTour) // PATCH /api/v1/tours/:id
  .delete(deleteTour); // DELETE /api/v1/tours/:id

export default router;
