import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  signup,
  login,
  refreshSession,
  logout,
  requestPasswordReset,
  resetPassword,
  changePassword,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

router.post("/signup", signup);
router.post("/login", loginLimiter, login);
router.post("/refresh", refreshSession);
router.post("/logout", logout);
router.post("/password/forgot", passwordResetLimiter, requestPasswordReset);
router.post("/password/reset", resetPassword);
router.post("/password/change", authMiddleware, changePassword);

export default router;
