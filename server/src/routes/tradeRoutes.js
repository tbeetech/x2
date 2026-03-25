import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { placeTrade } from "../controllers/tradeController.js";

const router = Router();

router.use(authMiddleware);
router.post("/orders", placeTrade);

export default router;
