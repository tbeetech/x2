import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  dashboardSummary,
  portfolioPositions,
  listTransactions,
  verificationTimeline,
  walletSnapshot,
} from "../controllers/dataController.js";

const router = Router();

router.use(authMiddleware);
router.get("/dashboard/summary", dashboardSummary);
router.get("/portfolio", portfolioPositions);
router.get("/transactions", listTransactions);
router.get("/verification", verificationTimeline);
router.get("/wallet", walletSnapshot);

export default router;
