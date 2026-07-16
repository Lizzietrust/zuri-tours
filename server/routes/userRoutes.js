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
  checkUserBody,
} from "../middleware/validationMiddleware.js";

const router = express.Router();

router.param("id", checkValidId);

router.route("/").get(getAllUsers).post(checkUserBody, createUser);

router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

export default router;
