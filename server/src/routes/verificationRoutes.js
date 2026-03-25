import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { submitVerificationDocuments, submitTransactionScreenshot } from "../controllers/verificationController.js";

const ACCEPTED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    if (!ACCEPTED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Unsupported file type."));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.post(
  "/documents",
  authMiddleware,
  (req, res, next) => {
    const handler = upload.fields([
      { name: "documents", maxCount: 10 },
      { name: "files", maxCount: 10 },
    ]);
    handler(req, res, (error) => {
      if (error && error.message === "Unsupported file type.") {
        res.status(400).json({ error: "Only PDF and image files are allowed." });
        return;
      }
      if (error) {
        res.status(413).json({ error: "Uploaded files are too large or exceed the limit." });
        return;
      }
      if (req.files && !Array.isArray(req.files)) {
        const collected = [];
        for (const value of Object.values(req.files)) {
          if (Array.isArray(value)) {
            collected.push(...value);
          }
        }
        req.files = collected;
      }
      next();
    });
  },
  submitVerificationDocuments,
);

// Upload screenshots tied to a specific transaction (deposit)
router.post(
  "/transactions/:transactionId/documents",
  authMiddleware,
  (req, res, next) => {
    const handler = upload.fields([
      { name: "documents", maxCount: 10 },
      { name: "files", maxCount: 10 },
    ]);
    handler(req, res, (error) => {
      if (error && error.message === "Unsupported file type.") {
        res.status(400).json({ error: "Only PDF and image files are allowed." });
        return;
      }
      if (error) {
        res.status(413).json({ error: "Uploaded files are too large or exceed the limit." });
        return;
      }
      if (req.files && !Array.isArray(req.files)) {
        const collected = [];
        for (const value of Object.values(req.files)) {
          if (Array.isArray(value)) {
            collected.push(...value);
          }
        }
        req.files = collected;
      }
      next();
    });
  },
  submitTransactionScreenshot,
);

export default router;
