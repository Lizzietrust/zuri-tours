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
  updateMyPhoto,
  adminListUsers,
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
import { uploadUserPhoto } from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* Everything below requires a logged-in user */
router.use(protect);

/* ============================================================
   CURRENT USER
   ============================================================ */

router
  .route("/me")
  .get(getMe)
  .patch(userUpdateLimiter, updateMe)
  .delete(userUpdateLimiter, deleteMe);

router
  .route("/me/photo")
  .patch(userUpdateLimiter, uploadUserPhoto, updateMyPhoto);

router.route("/me/password").patch(userUpdateLimiter, updateMyPassword);

/* ============================================================
   ADMIN COLLECTION ROUTES (static paths first)
   ============================================================ */

router.route("/").get(authorize("admin"), getAllUsers);

router
  .route("/create")
  .post(authorize("admin"), registerLimiter, validateUser, createUser);

router.route("/search").get(authorize("admin"), searchUsers);

router.route("/stats/all").get(authorize("admin"), getUsersWithStats);

router.route("/bulk/delete").delete(authorize("admin"), bulkDeleteUsers);

router.route("/bulk/update").patch(authorize("admin"), bulkUpdateUsers);

router
  .route("/by-role/:role")
  .get(
    authorize("admin"),
    hasPermission("manage:users"),
    userUpdateLimiter,
    getUsersByRole,
  );

/* ============================================================
   PER-USER DATA (self or admin, enforced in the controller)
   ============================================================ */

router.route("/:id/tours").get(checkValidId, getUserTours);
router.route("/:id/reviews").get(checkValidId, getUserReviews);
router.route("/:id/stats").get(checkValidId, getUserStats);

/* ============================================================
   SINGLE USER (admin)
   ============================================================ */

router
  .route("/:id")
  .get(checkValidId, authorize("admin"), getUser)
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

router.route("/admin/list").get(authorize("admin"), adminListUsers);

export default router;
