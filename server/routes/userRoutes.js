import express from "express";
import {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateUserRole,
  getUsersByRole,
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
  .route("/:id")
  .get(checkValidId, getUser)
  .patch(checkValidId, userUpdateLimiter, validateUser, updateUser)
  .delete(checkValidId, deleteUser);

router.use(authorize("admin"));

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
