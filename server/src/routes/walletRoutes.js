import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { deposit, withdraw, transfer, cryptoOptions } from "../controllers/walletController.js";

const router = Router();

router.use(authMiddleware);
router.post("/deposit", deposit);
router.post("/withdraw", withdraw);
router.post("/transfer", transfer);
router.get("/crypto-options", cryptoOptions);

export default router;
