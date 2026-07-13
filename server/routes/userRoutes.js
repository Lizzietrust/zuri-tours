import express from "express";
import {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

const router = express.Router();

router.route("/").get(getAllUsers).post(createUser);

router
  .route("/:id")
  .get(getUser) // GET /api/v1/users/:id
  .patch(updateUser) // PATCH /api/v1/users/:id
  .delete(deleteUser); // DELETE /api/v1/users/:id

export default router;
