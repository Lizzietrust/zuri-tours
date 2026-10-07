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
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  validateAuth,
  validateUser,
} from "../middleware/validationMiddleware.js";
import {
  registerLimiter,
  loginLimiter,
  resetPasswordLimiter,
  userUpdateLimiter,
} from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

/* ---------------- Public ---------------- */

router.post("/register", registerLimiter, validateUser, register);
router.post("/login", loginLimiter, validateAuth, login);
router.post("/forgotpassword", resetPasswordLimiter, forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);

/* ---------------- Protected ---------------- */

router.use(protect);

router.get("/me", getMe);
router.put("/updateme", userUpdateLimiter, updateMe);
router.put("/updatepassword", userUpdateLimiter, updatePassword);
router.get("/logout", logout);
router.post("/invalidate-sessions", invalidateAllSessions);

export default router;
