import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  markRead,
  markAllRead,
  archiveNotificationById,
  deleteNotificationById,
  clearReadNotifications,
  clearArchivedNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getNotifications);
router.patch("/:notificationId/read", markRead);
router.post("/read-all", markAllRead);
router.patch("/:notificationId/archive", archiveNotificationById);
router.delete("/read/clear", clearReadNotifications);
router.delete("/archived/clear", clearArchivedNotifications);
router.delete("/:notificationId", deleteNotificationById);

export default router;
