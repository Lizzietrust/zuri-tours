import express from "express";
import {
  register,
  login,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
  logout,
  invalidateAllSessions,
  deleteAccount,
} from "../controllers/authController.js";
import { protect, checkLoginAttempts } from "../middleware/authMiddleware.js";
import {
  validateAuth,
  validateUser,
} from "../middleware/validationMiddleware.js";

const router = express.Router();

router.post("/register", validateUser, register);
router.post("/login", checkLoginAttempts, validateAuth, login);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);

router.use(protect);

router.get("/me", getMe);
router.put("/updatepassword", updatePassword);
router.get("/logout", logout);
router.post("/invalidate-sessions", invalidateAllSessions);
router.delete("/delete-account", deleteAccount);

export default router;
