import express from "express";
import {
  register,
  login,
  getMe,
  updateMe,
  updatePassword,
  forgotPassword,
  resetPassword,
  logout,
  invalidateAllSessions,
  deleteMe,
} from "../controllers/authController.js";
import { protect, checkLoginAttempts } from "../middleware/authMiddleware.js";
import {
  validateAuth,
  validateUser,
} from "../middleware/validationMiddleware.js";
import {
  resetPasswordLimiter,
  loginLimiter,
} from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.post("/register", validateUser, register);
router.post("/login", loginLimiter, checkLoginAttempts, validateAuth, login);
router.post("/forgotpassword", resetPasswordLimiter, forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);

router.use(protect);

router.get("/me", getMe);
router.put("/updateme", updateMe);

router.put("/updatepassword", updatePassword);

router.delete("/deleteMe", deleteMe);

router.get("/logout", logout);
router.post("/invalidate-sessions", invalidateAllSessions);

export default router;
