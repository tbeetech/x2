import { UserModel } from "../models/User.js";
import { AuditLogModel } from "../models/AuditLog.js";
import { WalletModel } from "../models/Wallet.js";
import { PortfolioSnapshotModel } from "../models/PortfolioSnapshot.js";
import { buildAdminOverview } from "../services/adminOverviewService.js";
import { createNotification } from "../services/notificationService.js";

async function applySummaryUpdates(userId, summary = {}) {
  if (!summary || Object.keys(summary).length === 0) {
    return;
  }

  const existing = await PortfolioSnapshotModel.findOne({ userId }).sort({ createdAt: -1 }).exec();
  if (existing) {
    Object.assign(existing, summary, { updatedAt: new Date() });
    await existing.save();
    return;
  }

  const payload = {
    userId,
    totalValue: summary.totalValue ?? 0,
    totalReturn: summary.totalReturn ?? 0,
    dailyChange: summary.dailyChange ?? 0,
    netDeposits: summary.netDeposits ?? 0,
  };
  await PortfolioSnapshotModel.create(payload);
}

async function applyWalletUpdates(userId, wallet = {}) {
  if (!wallet || Object.keys(wallet).length === 0) {
    return;
  }

  await WalletModel.findOneAndUpdate(
    { userId },
    { $set: wallet, $setOnInsert: { userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();
}

export async function getOverview(req, res) {
  try {
    const overview = await buildAdminOverview();
    res.json(overview);
  } catch (error) {
    console.error("Admin overview error:", error);
    res.status(500).json({ error: "Unable to load admin overview" });
  }
}

export async function getAllUsers(req, res) {
  try {
    const users = await UserModel.find({ role: { $ne: "superadmin" } })
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Unable to fetch users" });
  }
}

export async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const updates = req.body ?? {};

    if (updates.role === "superadmin") {
      return res.status(403).json({ error: "Cannot escalate to superadmin" });
    }

    const targetUser = await UserModel.findById(userId).exec();
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.role === "admin" && req.admin.role !== "superadmin") {
      return res.status(403).json({ error: "Cannot modify admin users" });
    }

    const { summary: summaryUpdates, wallet: walletUpdates, ...userFieldUpdates } = updates;

    if (userFieldUpdates && Object.keys(userFieldUpdates).length > 0) {
      await UserModel.findByIdAndUpdate(
        userId, 
        { $set: userFieldUpdates }, 
        { new: true }
      ).select("-passwordHash");
      
      // If verification status changed, create verification event and notification
      if (userFieldUpdates.verificationStatus && userFieldUpdates.verificationStatus !== targetUser.verificationStatus) {
        const { VerificationEventModel } = await import("../models/VerificationEvent.js");
        
        // Create verification event
        const statusTitles = {
          pending: "Verification Pending",
          in_review: "Verification Under Review",
          approved: "Verification Approved",
          rejected: "Verification Rejected",
        };
        
        const statusDescriptions = {
          pending: "Your verification is pending. Please submit required documents.",
          in_review: "Your verification documents are being reviewed by our compliance team.",
          approved: "Your account has been verified and approved. You now have full access.",
          rejected: "Your verification was not approved. Please contact support for details.",
        };
        
        try {
          await VerificationEventModel.create({
            userId,
            title: statusTitles[userFieldUpdates.verificationStatus] || "Verification Status Updated",
            description: statusDescriptions[userFieldUpdates.verificationStatus] || `Status changed to ${userFieldUpdates.verificationStatus}`,
            status: userFieldUpdates.verificationStatus === "approved" ? "completed" : 
                    userFieldUpdates.verificationStatus === "in_review" ? "in_progress" : "pending",
            timestamp: new Date(),
          });
        } catch (eventError) {
          console.error("Failed to create verification event:", eventError);
        }
        
        // If verification status changed to approved, create notification
        if (userFieldUpdates.verificationStatus === "approved") {
          try {
            await createNotification({
              userId,
              type: "success",
              title: "Account Verified",
              body: "Congratulations! Your account has been verified and approved. You now have full access to all platform features.",
              metadata: {
                verificationStatus: "approved",
                approvedBy: req.admin._id,
              },
            });
            
            // Emit real-time notification via Socket.IO
            if (global.io) {
              global.io.to(userId.toString()).emit('verification_update', {
                status: 'approved',
                title: 'Account Verified',
                message: 'Your account has been verified and approved!',
                verificationStatus: 'approved',
              });
              
              global.io.to(userId.toString()).emit('notification', {
                type: 'verification_approved',
                title: 'Account Verified',
                message: 'Congratulations! Your account has been verified and approved.',
                verificationStatus: 'approved',
              });
              
              // Notify admin room that verification was processed
              global.io.to('admin-room').emit('admin_verification_processed', {
                userId: userId.toString(),
                status: 'approved',
                action: 'verification_approved',
              });
            }
          } catch (notifError) {
            console.error("Failed to create verification notification:", notifError);
          }
        }
        
        // If verification status changed to rejected, create notification
        if (userFieldUpdates.verificationStatus === "rejected") {
          try {
            await createNotification({
              userId,
              type: "error",
              title: "Verification Declined",
              body: "Your verification was not approved. Please contact support for assistance or resubmit your documents.",
              metadata: {
                verificationStatus: "rejected",
                rejectedBy: req.admin._id,
              },
            });
            
            // Emit real-time notification via Socket.IO
            if (global.io) {
              global.io.to(userId.toString()).emit('verification_update', {
                status: 'rejected',
                title: 'Verification Declined',
                message: 'Your verification was not approved. Please contact support.',
                verificationStatus: 'rejected',
              });
              
              global.io.to(userId.toString()).emit('notification', {
                type: 'verification_rejected',
                title: 'Verification Declined',
                message: 'Your verification was not approved. Please contact support for assistance.',
                verificationStatus: 'rejected',
              });
              
              // Notify admin room that verification was processed
              global.io.to('admin-room').emit('admin_verification_processed', {
                userId: userId.toString(),
                status: 'rejected',
                action: 'verification_rejected',
              });
            }
          } catch (notifError) {
            console.error("Failed to create rejection notification:", notifError);
          }
        }
        
        // If verification status changed to in_review, create notification
        if (userFieldUpdates.verificationStatus === "in_review") {
          try {
            await createNotification({
              userId,
              type: "info",
              title: "Verification Under Review",
              body: "Your verification documents are being reviewed by our compliance team. This usually takes 1-2 business days.",
              metadata: {
                verificationStatus: "in_review",
                reviewStartedBy: req.admin._id,
              },
            });
            
            // Emit real-time notification via Socket.IO
            if (global.io) {
              global.io.to(userId.toString()).emit('verification_update', {
                status: 'in_review',
                title: 'Verification Under Review',
                message: 'Your documents are being reviewed by our compliance team.',
                verificationStatus: 'in_review',
              });
              
              global.io.to(userId.toString()).emit('notification', {
                type: 'verification_in_review',
                title: 'Verification Under Review',
                message: 'Your verification documents are being reviewed.',
                verificationStatus: 'in_review',
              });
            }
          } catch (notifError) {
            console.error("Failed to create in_review notification:", notifError);
          }
        }
      }
    }

    await Promise.all([applyWalletUpdates(userId, walletUpdates), applySummaryUpdates(userId, summaryUpdates)]);

    await AuditLogModel.create({
      action: "UPDATE_USER",
      adminId: req.admin._id,
      targetUserId: userId,
      changes: updates,
    });

    const overview = await buildAdminOverview();
    res.json(overview);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Unable to update user" });
  }
}

export async function deactivateUser(req, res) {
  try {
    const { userId } = req.params;

    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.role === "admin" && req.admin.role !== "superadmin") {
      return res.status(403).json({ error: "Cannot deactivate admin users" });
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { isActive: false } },
      { new: true },
    ).select("-passwordHash");

    await AuditLogModel.create({
      action: "DEACTIVATE_USER",
      adminId: req.admin._id,
      targetUserId: userId,
    });

    res.json(user);
  } catch (error) {
    console.error("Deactivate user error:", error);
    res.status(500).json({ error: "Unable to deactivate user" });
  }
}

export async function getAuditLogs(req, res) {
  try {
    const logs = await AuditLogModel.find()
      .populate("adminId", "firstName lastName email")
      .populate("targetUserId", "firstName lastName email")
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(logs);
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({ error: "Unable to fetch audit logs" });
  }
}
