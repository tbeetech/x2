import mongoose from "mongoose";
import { InvestmentModel } from "../models/Investment.js";
import { OperationLogModel } from "../models/OperationLog.js";
import { getDashboardSnapshot } from "./dataService.js";
import { toObjectId } from "../lib/objectId.js";

export async function createInvestmentRequest({ userId: rawUserId, planId, planTitle, amount, duration, expectedReturn }) {
  const userId = toObjectId(rawUserId);
  const numericAmount = Number(amount);
  
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  if (!planId || !planTitle) {
    throw new Error("INVALID_PLAN");
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const [investment] = await InvestmentModel.create(
      [
        {
          userId,
          planId,
          planTitle,
          amount: numericAmount,
          duration: duration || "30 days",
          expectedReturn: expectedReturn || 0,
          status: "pending",
          createdAt: new Date(),
        },
      ],
      { session },
    );

    await OperationLogModel.create(
      [
        {
          userId,
          actorId: userId,
          type: "investment",
          action: "investment_requested",
          context: {
            amount: numericAmount,
            planId,
            planTitle,
            investmentId: investment._id,
          },
          occurredAt: new Date(),
        },
      ],
      { session },
    );

    await session.commitTransaction();
    
    // Create notification for user about pending investment
    try {
      const { createNotification } = await import("./notificationService.js");
      const { UserModel } = await import("../models/User.js");
      
      await createNotification({
        userId,
        type: "info",
        title: "Investment Processing",
        body: `Your investment request for ${planTitle} of $${numericAmount.toFixed(2)} is being processed. You'll be notified once it's approved.`,
        metadata: {
          investmentId: investment._id,
          amount: numericAmount,
          planTitle,
        },
      });

      // Create notification for admin about new investment request
      const adminUsers = await UserModel.find({ role: "admin" }).select("_id").lean().exec();
      
      for (const admin of adminUsers) {
        await createNotification({
          userId: admin._id,
          type: "info",
          title: "New investment request",
          body: `User is requesting ${planTitle} investment of $${numericAmount.toFixed(2)}. Pending your approval.`,
          metadata: {
            investmentId: investment._id,
            requestingUserId: userId.toString(),
            amount: numericAmount,
            planTitle,
            requiresAction: true,
            actionType: "investment_approval",
          },
        });
      }
    } catch (notifError) {
      // Don't fail the investment if notification creation fails
      console.error("Failed to create investment notification:", notifError);
    }
    
    const dashboard = await getDashboardSnapshot(userId);
    
    return { investment, dashboard };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function getUserInvestments(rawUserId) {
  const userId = toObjectId(rawUserId);
  return await InvestmentModel.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function approveInvestment({ investmentId, adminId, note }) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    console.log('approveInvestment called with:', { investmentId, adminId, note });
    
    const investment = await InvestmentModel.findById(investmentId).session(session).exec();
    if (!investment) {
      console.error('Investment not found:', investmentId);
      throw new Error("INVESTMENT_NOT_FOUND");
    }
    if (investment.status !== "pending") {
      console.error('Investment already processed:', investment.status);
      throw new Error("INVESTMENT_ALREADY_PROCESSED");
    }

    const userId = investment.userId;
    console.log('Approving investment for userId:', userId);

    // Update investment status
    investment.status = "active";
    investment.approvedAt = new Date();
    investment.adminNote = note ?? "";
    investment.metadata = {
      ...(investment.metadata ?? {}),
      approvedBy: adminId ? adminId.toString() : undefined,
      approvedAt: investment.approvedAt
    };
    await investment.save({ session });
    console.log('Investment updated to active');

    await OperationLogModel.create(
      [
        {
          userId,
          actorId: adminId,
          type: "investment",
          action: "investment_approved",
          context: {
            investmentId: investment._id,
            amount: investment.amount,
            planTitle: investment.planTitle,
          },
          occurredAt: investment.approvedAt,
        },
      ],
      { session },
    );
    console.log('Operation log created');

    await session.commitTransaction();
    console.log('Investment approval transaction committed successfully');

    // Create notification for user
    try {
      const { createNotification } = await import("./notificationService.js");
      await createNotification({
        userId,
        type: "success",
        title: "Investment Approved",
        body: `Your investment in ${investment.planTitle} for $${investment.amount.toFixed(2)} has been approved and is now active.`,
        metadata: {
          investmentId: investment._id,
          amount: investment.amount,
          planTitle: investment.planTitle,
        },
      });
      
      // Emit real-time notification via Socket.IO
      if (global.io) {
        global.io.to(userId.toString()).emit('notification', {
          type: 'investment_approved',
          title: 'Investment Approved',
          message: `Your investment in ${investment.planTitle} for $${investment.amount.toFixed(2)} has been approved.`,
          investment: {
            id: investment._id,
            amount: investment.amount,
            planTitle: investment.planTitle,
            status: 'active',
          },
        });
      }
    } catch (notifError) {
      console.error("Failed to create approval notification:", notifError);
    }

    session.endSession();
    return investment.toObject();
  } catch (error) {
    console.error('Error in approveInvestment:', error);
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

export async function rejectInvestment({ investmentId, adminId, reason }) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    console.log('rejectInvestment called with:', { investmentId, adminId, reason });
    
    const investment = await InvestmentModel.findById(investmentId).session(session).exec();
    if (!investment) {
      console.error('Investment not found:', investmentId);
      throw new Error("INVESTMENT_NOT_FOUND");
    }
    if (investment.status !== "pending") {
      console.error('Investment already processed:', investment.status);
      throw new Error("INVESTMENT_ALREADY_PROCESSED");
    }

    const userId = investment.userId;
    console.log('Rejecting investment for userId:', userId);

    // Update investment status
    investment.status = "rejected";
    investment.rejectedAt = new Date();
    investment.adminNote = reason ?? "";
    investment.metadata = {
      ...(investment.metadata ?? {}),
      rejectedBy: adminId ? adminId.toString() : undefined,
      rejectedAt: investment.rejectedAt,
      rejectionReason: reason ?? "",
    };
    await investment.save({ session });
    console.log('Investment updated to rejected');

    await OperationLogModel.create(
      [
        {
          userId,
          actorId: adminId,
          type: "investment",
          action: "investment_rejected",
          context: {
            investmentId: investment._id,
            amount: investment.amount,
            planTitle: investment.planTitle,
            reason: reason ?? "",
          },
          occurredAt: investment.rejectedAt,
        },
      ],
      { session },
    );
    console.log('Operation log created');

    await session.commitTransaction();
    console.log('Investment rejection transaction committed successfully');

    // Create notification for user
    try {
      const { createNotification } = await import("./notificationService.js");
      await createNotification({
        userId,
        type: "error",
        title: "Investment Declined",
        body: `Your investment request for ${investment.planTitle} has been declined. ${reason ? `Reason: ${reason}` : ''}`,
        metadata: {
          investmentId: investment._id,
          amount: investment.amount,
          planTitle: investment.planTitle,
          reason: reason ?? "",
        },
      });
      
      // Emit real-time notification via Socket.IO
      if (global.io) {
        global.io.to(userId.toString()).emit('notification', {
          type: 'investment_rejected',
          title: 'Investment Declined',
          message: `Your investment in ${investment.planTitle} has been declined.`,
          investment: {
            id: investment._id,
            amount: investment.amount,
            planTitle: investment.planTitle,
            status: 'rejected',
            reason: reason ?? "",
          },
        });
      }
    } catch (notifError) {
      console.error("Failed to create rejection notification:", notifError);
    }

    session.endSession();
    return investment.toObject();
  } catch (error) {
    console.error('Error in rejectInvestment:', error);
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}
