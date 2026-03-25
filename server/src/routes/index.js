import { Router } from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import dataRoutes from "./dataRoutes.js";
import marketRoutes from "./marketRoutes.js";
import adminRoutes from "./adminRoutes.js";
import contentRoutes from "./contentRoutes.js";
import verificationRoutes from "./verificationRoutes.js";
import tradeRoutes from "./tradeRoutes.js";
import walletRoutes from "./walletRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import investmentRoutes from "./investmentRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/market", marketRoutes);
router.use("/content", contentRoutes);
router.use("/verification", verificationRoutes);
router.use("/trade", tradeRoutes);
router.use("/wallet", walletRoutes);
router.use("/notifications", notificationRoutes);
router.use("/investments", investmentRoutes);
router.use("/user", userRoutes);
router.use("/admin", adminRoutes);
router.use("/", dataRoutes);

export default router;
