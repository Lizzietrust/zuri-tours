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

const router = express.Router();

router.use(protect);

router
  .route("/me")
  .get(authorize("guide", "lead-guide"), getGuide)
  .patch(authorize("guide", "lead-guide"), updateGuideProfile);

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

router.route("/:id/status").patch(updateGuideStatus);

router
  .route("/:id/assign-tour/:tourId")
  .post(hasPermission("assign:tours"), assignTourToGuide);

router
  .route("/:id/remove-tour/:tourId")
  .delete(hasPermission("manage:guides"), removeTourFromGuide);

export default router;
