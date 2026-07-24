import express from "express";
import {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import {
  checkValidId,
  validateUser,
} from "../middleware/validationMiddleware.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.route("/").get(getAllUsers).post(validateUser, createUser);

router
  .route("/:id")
  .get(checkValidId, getUser)
  .patch(checkValidId, validateUser, updateUser)
  .delete(checkValidId, deleteUser);

export default router;
