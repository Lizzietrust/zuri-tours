import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { checkValidId } from "../middleware/validationMiddleware.js";
import { userUpdateLimiter } from "../middleware/rateLimitMiddleware.js";
import {
  getGuideDashboard,
  getTourRoster,
  updateMyAvailability,
  getTeam,
  setTourGuide,
} from "../controllers/guideController.js";

const router = express.Router();

/* Guide workspace: guides and lead guides only (admins use /admin) */
router.use(protect, authorize("guide", "lead-guide"));

router.get("/dashboard", getGuideDashboard);
router.get("/tours/:id/roster", checkValidId, getTourRoster);
router.patch("/availability", userUpdateLimiter, updateMyAvailability);

/* Lead guide only */
router.get("/team", authorize("lead-guide"), getTeam);
router.patch(
  "/tours/:id/guides",
  authorize("lead-guide"),
  checkValidId,
  userUpdateLimiter,
  setTourGuide,
);

export default router;
