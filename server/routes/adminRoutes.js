import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { getDashboardStats } from "../controllers/adminController.js";

const router = express.Router();

router.use(protect, authorize("admin"));
router.get("/stats", getDashboardStats);

export default router;
