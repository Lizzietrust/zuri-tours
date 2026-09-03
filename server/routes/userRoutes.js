import express from "express";
import {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateUserRole,
  getUsersByRole,
  getUserTours,
  getUserReviews,
  getUserStats,
  getUsersWithStats,
  searchUsers,
  bulkUpdateUsers,
  bulkDeleteUsers,
} from "../controllers/userController.js";
import {
  checkValidId,
  validateUser,
} from "../middleware/validationMiddleware.js";
import {
  protect,
  authorize,
  hasPermission,
} from "../middleware/authMiddleware.js";
import {
  registerLimiter,
  userUpdateLimiter,
} from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.route("/").get(getAllUsers);

router.route("/create").post(registerLimiter, validateUser, createUser);

router.route("/search").get(protect, authorize("admin"), searchUsers);

router.use(protect);

router.route("/:userId/tours").get(checkValidId, getUserTours);

router.route("/:userId/reviews").get(checkValidId, getUserReviews);

router.route("/:userId/stats").get(checkValidId, getUserStats);

router
  .route("/:id")
  .get(checkValidId, getUser)
  .patch(checkValidId, userUpdateLimiter, validateUser, updateUser)
  .delete(checkValidId, deleteUser);

router.use(authorize("admin"));

router.route("/bulk/update").patch(bulkUpdateUsers);
router.route("/bulk/delete").delete(bulkDeleteUsers);

router.route("/stats/all").get(getUsersWithStats);

router
  .route("/:id/role")
  .patch(
    checkValidId,
    hasPermission("manage:roles"),
    userUpdateLimiter,
    updateUserRole,
  );

router
  .route("/by-role/:role")
  .get(hasPermission("manage:users"), userUpdateLimiter, getUsersByRole);

export default router;
