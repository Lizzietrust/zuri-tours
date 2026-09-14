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

/* ============================================================
   PUBLIC ROUTES
   ============================================================ */

router.route("/").get(getAllUsers);

router.route("/create").post(registerLimiter, validateUser, createUser);

router.route("/search").get(protect, authorize("admin"), searchUsers);

/* ============================================================
   AUTHENTICATED ROUTES
   ============================================================ */

router.use(protect);

/* ---------- /me ROUTES (must come before /:id) ---------- */

router
  .route("/me")
  .get(getMe)
  .patch(userUpdateLimiter, updateMe)
  .delete(deleteMe);

router.route("/me/password").patch(userUpdateLimiter, updateMyPassword);

/* ---------- Nested user routes ---------- */

router.route("/:userId/tours").get(checkValidId, getUserTours);
router.route("/:userId/reviews").get(checkValidId, getUserReviews);
router.route("/:userId/stats").get(checkValidId, getUserStats);

/* ---------- Single user CRUD ---------- */

router
  .route("/:id")
  .get(checkValidId, getUser)
  .patch(checkValidId, userUpdateLimiter, validateUser, updateUser)
  .delete(checkValidId, deleteUser);

router
  .route("/:id/restore")
  .patch(authorize("admin"), checkValidId, restoreUser);

router
  .route("/:id/permanent")
  .delete(authorize("admin"), checkValidId, permanentDeleteUser);

router.route("/bulk/delete").delete(authorize("admin"), bulkDeleteUsers);

/* ============================================================
   ADMIN-ONLY ROUTES
   ============================================================ */

router.use(authorize("admin"));

router.route("/bulk/update").patch(bulkUpdateUsers);

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
