import { NotificationModel } from "../models/Notification.js";
import logger from "../lib/logger.js";

export async function createNotification({ userId, type = "info", title, body, metadata = {} }) {
  try {
    const notification = await NotificationModel.create({
      userId,
      type,
      title,
      body,
      metadata,
      read: false,
    });
    return notification;
  } catch (error) {
    logger.error({ err: error, userId, title }, "Failed to create notification");
    throw error;
  }
}

export async function getUserNotifications(userId, { limit = 50, unreadOnly = false } = {}) {
  const query = { userId };
  if (unreadOnly) {
    query.read = false;
  }
  
  return NotificationModel.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();
}

export async function markNotificationRead(notificationId, userId) {
  return NotificationModel.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { read: true } },
    { new: true }
  ).exec();
}

export async function markAllNotificationsRead(userId) {
  return NotificationModel.updateMany(
    { userId, read: false },
    { $set: { read: true } }
  ).exec();
}

export async function archiveNotification(notificationId, userId) {
  return NotificationModel.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { archived: true, read: true } },
    { new: true }
  ).exec();
}

export async function deleteNotification(notificationId, userId) {
  return NotificationModel.findOneAndDelete(
    { _id: notificationId, userId }
  ).exec();
}

export async function deleteReadNotifications(userId) {
  return NotificationModel.deleteMany(
    { userId, read: true }
  ).exec();
}

export async function deleteArchivedNotifications(userId, { olderThan } = {}) {
  const query = { userId, archived: true };
  if (olderThan instanceof Date && !Number.isNaN(olderThan.getTime())) {
    query.createdAt = { $lte: olderThan };
  }

  return NotificationModel.deleteMany(query).exec();
}
