import { Router } from "express";
import { getSiteContent } from "../controllers/siteContentController.js";

const router = Router();

router.get("/", getSiteContent);

export default router;
