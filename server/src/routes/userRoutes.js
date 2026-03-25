import { Router } from "express";
import { profile, updateProfile } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/profile", authMiddleware, profile);
router.put("/profile", authMiddleware, updateProfile);

export default router;
