import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createInvestment, listInvestments } from "../controllers/investmentController.js";

const router = Router();

router.use(authMiddleware);
router.post("/create", createInvestment);
router.get("/list", listInvestments);

export default router;
