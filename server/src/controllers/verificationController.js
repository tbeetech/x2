import crypto from "node:crypto";
import { Types } from "mongoose";
import logger from "../lib/logger.js";
import { VerificationDocumentModel } from "../models/VerificationDocument.js";
import { VerificationEventModel } from "../models/VerificationEvent.js";
import { OperationLogModel } from "../models/OperationLog.js";
import { UserModel } from "../models/User.js";
import { getDashboardSnapshot } from "../services/dataService.js";

function toObjectId(value) {
  if (value instanceof Types.ObjectId) {
    return value;
  }
  return new Types.ObjectId(value);
}

export async function submitVerificationDocuments(req, res) {
  const files = Array.isArray(req.files) ? req.files : [];
  const notes = req.body?.notes ?? "";

  if (!files.length) {
    return res.status(400).json({ error: "At least one document must be uploaded." });
  }

  const userId = toObjectId(req.user.id);
  const now = new Date();

  try {
    const user = await UserModel.findById(userId).lean().exec();
    if (!user) {
      return res.status(404).json({ error: "User record not found." });
    }

    const event = await VerificationEventModel.create({
      userId,
      title: "Verification documents submitted",
      description: notes || "Awaiting compliance review.",
      status: "pending",
      timestamp: now,
    });

    const documents = files.map((file) => ({
      userId,
      eventId: event._id,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      notes,
      data: file.buffer,
      checksum: crypto.createHash("sha256").update(file.buffer).digest("hex"),
    }));

    const inserted = await VerificationDocumentModel.insertMany(documents, { ordered: true });

    await UserModel.findByIdAndUpdate(userId, { verificationStatus: "in_review" }, { new: true }).exec();

    await OperationLogModel.create({
      userId,
      type: "verification",
      action: "documents_submitted",
      context: {
        documentIds: inserted.map((doc) => doc._id.toString()),
        eventId: event._id.toString(),
        notes,
      },
      occurredAt: now,
      actorId: userId,
    });

    // Emit real-time notification to user
    if (global.io) {
      global.io.to(userId.toString()).emit('verification_update', {
        status: 'in_review',
        title: 'Documents Submitted',
        message: 'Your verification documents are under review.',
        verificationStatus: 'in_review',
      });

      global.io.to(userId.toString()).emit('notification', {
        type: 'verification_submitted',
        title: 'Documents Submitted',
        message: 'Your verification documents have been submitted and are under review.',
        verificationStatus: 'in_review',
      });

      // Notify all admins of new verification submission
      global.io.to('admin-room').emit('admin_notification', {
        type: 'new_verification',
        title: 'New Verification Submission',
        message: `${user.username || user.email} has submitted verification documents.`,
        userId: userId.toString(),
        username: user.username || user.email,
        documentCount: files.length,
        timestamp: now,
      });
    }

    const dashboard = await getDashboardSnapshot(userId);

    return res.status(201).json({
      message: "Verification submitted.",
      dashboard,
    });
  } catch (error) {
    logger.error({ err: error }, "submitVerificationDocuments error");
    return res.status(500).json({ error: "Unable to store verification documents." });
  }
}

export async function submitTransactionScreenshot(req, res) {
  const files = Array.isArray(req.files) ? req.files : [];
  const notes = req.body?.notes ?? "";
  const { transactionId } = req.params ?? {};

  if (!transactionId) {
    return res.status(400).json({ error: "transactionId is required in the path." });
  }

  if (!files.length) {
    return res.status(400).json({ error: "At least one screenshot must be uploaded." });
  }

  const userId = toObjectId(req.user.id);
  const now = new Date();

  try {
    // Lazy require TransactionModel to avoid cycles
    const { TransactionModel } = await import("../models/Transaction.js");
    const transaction = await TransactionModel.findById(transactionId).lean().exec();
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found." });
    }

    // Only allow screenshots for pending deposits (or allow by owner)
    if (transaction.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You are not allowed to attach screenshots to this transaction." });
    }

    const event = await VerificationEventModel.create({
      userId,
      transactionId: toObjectId(transactionId),
      title: "Deposit payment screenshot",
      description: notes || `Payment screenshot for transaction ${transactionId}`,
      status: "pending",
      timestamp: now,
    });

    const documents = files.map((file) => ({
      userId,
      eventId: event._id,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      notes,
      data: file.buffer,
      checksum: crypto.createHash("sha256").update(file.buffer).digest("hex"),
    }));

    const inserted = await VerificationDocumentModel.insertMany(documents, { ordered: true });

    await OperationLogModel.create({
      userId,
      type: "transaction",
      action: "deposit_screenshot_uploaded",
      actorId: userId,
      context: {
        transactionId,
        documentIds: inserted.map((d) => d._id.toString()),
        notes,
      },
      occurredAt: now,
    });

    // Notify admins by email (best-effort)
    try {
      const { sendAdminNotification } = await import("../services/emailService.js");
      const subject = `Deposit screenshot uploaded: ${transactionId}`;
      const html = `User <strong>${req.user.email}</strong> uploaded a payment screenshot for transaction <strong>${transactionId}</strong> at ${now.toISOString()}<br/>Amount: ${transaction.total ?? transaction.amount} ${transaction.symbol ?? ''}<br/>Reference: ${transaction.reference ?? ''}`;
      void sendAdminNotification({ subject, html });
    } catch (err) {
      // ignore email failures
      logger.warn({ err }, "Admin notification failed (non-fatal)");
    }

    const dashboard = await getDashboardSnapshot(userId);
    return res.status(201).json({ message: "Screenshot uploaded.", dashboard });
  } catch (error) {
    logger.error({ err: error }, "submitTransactionScreenshot error");
    return res.status(500).json({ error: "Unable to store screenshot documents." });
  }
}

export async function listVerificationDocuments(req, res) {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: "userId is required." });
  }

  try {
    const queryUserId = toObjectId(userId);
    const documents = await VerificationDocumentModel.find({ userId: queryUserId })
      .sort({ uploadedAt: -1 })
      .select("-data")
      .lean()
      .exec();
    const events = await VerificationEventModel.find({ userId: queryUserId })
      .sort({ timestamp: -1 })
      .lean()
      .exec();

    return res.json({
      documents: documents.map((doc) => ({
        id: doc._id.toString(),
        filename: doc.filename,
        mimeType: doc.mimeType,
        size: doc.size,
        uploadedAt: doc.uploadedAt ?? doc.createdAt,
        checksum: doc.checksum,
        notes: doc.notes,
        eventId: doc.eventId?.toString(),
      })),
      events: events.map((event) => ({
        id: event._id.toString(),
        title: event.title,
        description: event.description,
        status: event.status,
        timestamp: event.timestamp,
      })),
    });
  } catch (error) {
    logger.error({ err: error }, "listVerificationDocuments error");
    return res.status(500).json({ error: "Unable to load verification documents." });
  }
}

export async function downloadVerificationDocument(req, res) {
  const { documentId } = req.params;
  if (!documentId) {
    return res.status(400).json({ error: "documentId is required." });
  }

  try {
    const doc = await VerificationDocumentModel.findById(documentId).lean().exec();
    if (!doc) {
      return res.status(404).json({ error: "Document not found." });
    }

    res.setHeader("Content-Type", doc.mimeType ?? "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.filename}"`);
    res.send(doc.data);
  } catch (error) {
    logger.error({ err: error }, "downloadVerificationDocument error");
    res.status(500).json({ error: "Unable to download verification document." });
  }
}
