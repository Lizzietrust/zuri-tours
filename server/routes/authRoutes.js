import express from "express";
import {
  register,
  login,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
  logout,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  validateAuth,
  validateUser,
} from "../middleware/validationMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", validateUser, register);
router.post("/login", validateAuth, login);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);

// Protected routes
router.use(protect);
router.get("/me", getMe);
router.put("/updatepassword", updatePassword);
router.get("/logout", logout);

export default router;
