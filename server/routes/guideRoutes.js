import express from "express";
import {
  getGuides,
  getGuide,
  updateGuideProfile,
  getGuideStatistics,
  getGuidePerformance,
  getAllGuidesAdmin,
  updateGuideStatus,
  assignTourToGuide,
  removeTourFromGuide,
} from "../controllers/guideController.js";
import {
  protect,
  authorize,
  isLeadGuideOrAdmin,
  hasPermission,
} from "../middleware/authMiddleware.js";
import { userUpdateLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.use(protect);

router
  .route("/me")
  .get(authorize("guide", "lead-guide"), getGuide)
  .patch(
    authorize("guide", "lead-guide"),
    userUpdateLimiter,
    updateGuideProfile,
  );

router
  .route("/me/statistics")
  .get(authorize("guide", "lead-guide"), getGuideStatistics);

router
  .route("/me/performance")
  .get(authorize("guide", "lead-guide"), getGuidePerformance);

router.route("/").get(getGuides);
router.route("/:id").get(getGuide);

router.use(isLeadGuideOrAdmin);

router.route("/admin/all").get(getAllGuidesAdmin);

router.route("/:id/status").patch(userUpdateLimiter, updateGuideStatus);

router
  .route("/:id/assign-tour/:tourId")
  .post(hasPermission("assign:tours"), userUpdateLimiter, assignTourToGuide);

router
  .route("/:id/remove-tour/:tourId")
  .delete(
    hasPermission("manage:guides"),
    userUpdateLimiter,
    removeTourFromGuide,
  );

export default router;
