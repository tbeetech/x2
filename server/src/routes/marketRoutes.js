import { Router } from "express";
import { marketTop } from "../controllers/dataController.js";
import { getStockQuotes, getStockHistory } from "../controllers/stockController.js";

const router = Router();

router.get("/top", marketTop);
router.get("/stocks/quotes", getStockQuotes);
router.get("/stocks/:symbol/history", getStockHistory);

export default router;
