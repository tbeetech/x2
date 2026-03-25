import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  archiveNotification,
  deleteNotification,
  deleteReadNotifications,
  deleteArchivedNotifications,
} from "../services/notificationService.js";
import logger from "../lib/logger.js";

function serializeNotification(notificationDoc) {
  if (!notificationDoc) return null;
  const { _id, __v, ...rest } = notificationDoc;
  return {
    id: (_id ?? notificationDoc.id).toString(),
    ...rest,
  };
}

export async function getNotifications(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const unreadOnly = req.query.unreadOnly === "true";
    
    const notifications = await getUserNotifications(req.user.id, { limit, unreadOnly });
    
    return res.json({ 
      notifications: notifications.map(serializeNotification) 
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch notifications");
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
}

export async function markRead(req, res) {
  try {
    const { notificationId } = req.params;
    
    const notification = await markNotificationRead(notificationId, req.user.id);
    
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    return res.json({ notification: serializeNotification(notification) });
  } catch (error) {
    logger.error({ err: error }, "Failed to mark notification as read");
    return res.status(500).json({ error: "Failed to update notification" });
  }
}

export async function markAllRead(req, res) {
  try {
    const result = await markAllNotificationsRead(req.user.id);
    
    return res.json({ 
      success: true, 
      updated: result.modifiedCount 
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to mark all notifications as read");
    return res.status(500).json({ error: "Failed to update notifications" });
  }
}

export async function archiveNotificationById(req, res) {
  try {
    const { notificationId } = req.params;
    
    const notification = await archiveNotification(notificationId, req.user.id);
    
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    return res.json({ notification: serializeNotification(notification) });
  } catch (error) {
    logger.error({ err: error }, "Failed to archive notification");
    return res.status(500).json({ error: "Failed to archive notification" });
  }
}

export async function deleteNotificationById(req, res) {
  try {
    const { notificationId } = req.params;
    
    const notification = await deleteNotification(notificationId, req.user.id);
    
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    return res.json({ 
      success: true,
      message: "Notification deleted successfully" 
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to delete notification");
    return res.status(500).json({ error: "Failed to delete notification" });
  }
}

export async function clearReadNotifications(req, res) {
  try {
    const result = await deleteReadNotifications(req.user.id);
    
    return res.json({ 
      success: true, 
      deleted: result.deletedCount 
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to clear read notifications");
    return res.status(500).json({ error: "Failed to clear notifications" });
  }
}

export async function clearArchivedNotifications(req, res) {
  try {
    const olderThanDays = Number(req.query.olderThanDays ?? req.body?.olderThanDays);
    const hasCutoff = Number.isFinite(olderThanDays) && olderThanDays > 0;
    const cutoffDate = hasCutoff ? new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000) : null;

    const result = await deleteArchivedNotifications(req.user.id, { olderThan: cutoffDate });

    return res.json({
      success: true,
      deleted: result.deletedCount,
      olderThanDays: hasCutoff ? olderThanDays : null,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to clear archived notifications");
    return res.status(500).json({ error: "Failed to clear archived notifications" });
  }
}
