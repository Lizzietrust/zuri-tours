import express from "express";
import {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  permanentDeleteUser,
  restoreUser,
  bulkDeleteUsers,
  updateUserRole,
  getUsersByRole,
  getUserTours,
  getUserReviews,
  getUserStats,
  getUsersWithStats,
  searchUsers,
  bulkUpdateUsers,
  getMe,
  updateMe,
  deleteMe,
  updateMyPassword,
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

router.use(protect);

router
  .route("/me")
  .get(getMe)
  .patch(userUpdateLimiter, updateMe)
  .delete(userUpdateLimiter, deleteMe);

router.route("/me/password").patch(userUpdateLimiter, updateMyPassword);

router.route("/:userId/tours").get(checkValidId, getUserTours);
router.route("/:userId/reviews").get(checkValidId, getUserReviews);

router.route("/:userId/stats").get(checkValidId, getUserStats);

router.route("/search").get(authorize("admin"), searchUsers);

router.route("/bulk/delete").delete(authorize("admin"), bulkDeleteUsers);

router.route("/bulk/update").patch(authorize("admin"), bulkUpdateUsers);

router.route("/stats/all").get(authorize("admin"), getUsersWithStats);

router
  .route("/by-role/:role")
  .get(
    authorize("admin"),
    hasPermission("manage:users"),
    userUpdateLimiter,
    getUsersByRole,
  );

/* ============================================================
   SINGLE USER
   ============================================================ */

router
  .route("/:id")
  .get(checkValidId, getUser)
  .patch(
    checkValidId,
    userUpdateLimiter,
    authorize("admin"),
    validateUser,
    updateUser,
  )
  .delete(checkValidId, authorize("admin"), deleteUser);

router
  .route("/:id/restore")
  .patch(authorize("admin"), checkValidId, restoreUser);

router
  .route("/:id/permanent")
  .delete(authorize("admin"), checkValidId, permanentDeleteUser);

router
  .route("/:id/role")
  .patch(
    authorize("admin"),
    checkValidId,
    hasPermission("manage:roles"),
    userUpdateLimiter,
    updateUserRole,
  );

export default router;
