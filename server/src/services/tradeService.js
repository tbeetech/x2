import mongoose from "mongoose";
import { WalletModel } from "../models/Wallet.js";
import { PositionModel } from "../models/Position.js";
import { TransactionModel } from "../models/Transaction.js";
import { PortfolioSnapshotModel } from "../models/PortfolioSnapshot.js";
import { OperationLogModel } from "../models/OperationLog.js";
import { UserModel } from "../models/User.js";
import { getDashboardSnapshot } from "./dataService.js";
import { createNotification } from "./notificationService.js";
import logger from "../lib/logger.js";

const { Types } = mongoose;

function toObjectId(value) {
  if (value instanceof Types.ObjectId) return value;
  return new Types.ObjectId(value);
}

async function ensureWallet(userId, session) {
  const wallet = await WalletModel.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: {
        balance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        earningRate: 0,
        pendingHold: 0,
      },
    },
    { upsert: true, new: true, session },
  ).exec();
  return wallet;
}

function computePositionMetrics({ amount, price, costBasis }) {
  const currentValue = amount * price;
  const pnl = currentValue - costBasis;
  const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
  return { currentValue, pnl, pnlPercent };
}

async function snapshotPortfolio(userId, session) {
  const [wallet, positions] = await Promise.all([
    WalletModel.findOne({ userId }).session(session).lean().exec(),
    PositionModel.find({ userId }).session(session).lean().exec(),
  ]);
  const totalPositionValue = positions.reduce((acc, position) => acc + (position.currentValue ?? 0), 0);
  const cashBalance = wallet?.balance ?? 0;
  const totalValue = totalPositionValue + cashBalance;
  const netDeposits = (wallet?.totalDeposited ?? 0) - (wallet?.totalWithdrawn ?? 0);
  const totalReturn = netDeposits > 0 ? ((totalValue - netDeposits) / netDeposits) * 100 : 0;

  const snapshot = await PortfolioSnapshotModel.create(
    [
      {
        userId,
        totalValue,
        totalReturn,
        dailyChange: 0,
        netDeposits,
      },
    ],
    { session },
  );
  return snapshot[0];
}

async function updateAllocation(userId, session) {
  const positions = await PositionModel.find({ userId }).session(session).exec();
  const totalValue = positions.reduce((acc, position) => acc + (position.currentValue ?? 0), 0);
  if (totalValue <= 0) {
    await PositionModel.updateMany({ userId }, { $set: { allocation: 0 } }, { session }).exec();
    return;
  }
  await Promise.all(
    positions.map((position) =>
      PositionModel.updateOne(
        { _id: position._id },
        { $set: { allocation: (position.currentValue / totalValue) * 100 } },
        { session },
      ),
    ),
  );
}

function normalizeTradeInput({ symbol, name, side, quantity, price }) {
  const normalizedSymbol = symbol?.toUpperCase();
  if (!normalizedSymbol || !name) throw new Error("Symbol and name are required.");
  const tradeSide = (side ?? "").toLowerCase();
  if (!["buy", "sell"].includes(tradeSide)) throw new Error("Trade side must be 'buy' or 'sell'.");
  const amount = Number(quantity);
  const unitPrice = Number(price);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Quantity must be greater than zero.");
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) throw new Error("Price must be greater than zero.");
  const total = amount * unitPrice;
  return { normalizedSymbol, resolvedName: name, tradeSide, amount, unitPrice, total };
}

export async function executeTrade(params, { session: externalSession } = {}) {
  const { normalizedSymbol, resolvedName, tradeSide, amount, unitPrice, total } = normalizeTradeInput(params);
  const userId = toObjectId(params.userId);

  const session = externalSession ?? (await mongoose.startSession());
  if (!externalSession) session.startTransaction();

  try {
    const wallet = await ensureWallet(userId, session);
    if (tradeSide === "buy" && wallet.balance < total) {
      throw new Error("INSUFFICIENT_FUNDS");
    }

    let position = await PositionModel.findOne({ userId, symbol: normalizedSymbol }).session(session).exec();
    if (!position && tradeSide === "sell") {
      throw new Error("INSUFFICIENT_POSITION");
    }
    if (!position) {
      position = await PositionModel.create(
        [
          {
            userId,
            symbol: normalizedSymbol,
            name: resolvedName,
            amount: 0,
            averagePrice: 0,
            costBasis: 0,
            currentValue: 0,
            allocation: 0,
            pendingSell: 0,
          },
        ],
        { session },
      ).then((records) => records[0]);
    }

    if (tradeSide === "sell" && position.amount < amount) {
      throw new Error("INSUFFICIENT_POSITION");
    }

    let nextAmount;
    let nextCostBasis;
    if (tradeSide === "buy") {
      wallet.balance -= total;
      nextAmount = position.amount + amount;
      nextCostBasis = position.costBasis + total;
    } else {
      wallet.balance += total;
      const remainingAmount = position.amount - amount;
      const unitCost = position.amount > 0 ? position.costBasis / position.amount : 0;
      nextAmount = remainingAmount;
      nextCostBasis = unitCost * remainingAmount;
    }

    const { currentValue, pnl, pnlPercent } = computePositionMetrics({
      amount: nextAmount,
      price: unitPrice,
      costBasis: nextCostBasis,
    });

    if (nextAmount <= 0) {
      await PositionModel.deleteOne({ _id: position._id }).session(session).exec();
    } else {
      position.amount = nextAmount;
      position.costBasis = nextCostBasis;
      position.averagePrice = nextAmount > 0 ? nextCostBasis / nextAmount : 0;
      position.currentValue = currentValue;
      position.pnl = pnl;
      position.pnlPercent = pnlPercent;
      await position.save({ session });
    }

    await wallet.save({ session });

    await TransactionModel.create(
      [
        {
          userId,
          type: "trade",
          asset: resolvedName,
          symbol: normalizedSymbol,
          amount,
          price: unitPrice,
          total,
          status: "completed",
          direction: tradeSide === "buy" ? "out" : "in",
          occurredOn: new Date(),
          completedAt: new Date(),
          metadata: { side: tradeSide },
        },
      ],
      { session },
    );

    await OperationLogModel.create(
      [
        {
          userId,
          actorId: userId,
          type: "trade",
          action: tradeSide === "buy" ? "buy_order_executed" : "sell_order_executed",
          context: {
            symbol: normalizedSymbol,
            name: resolvedName,
            quantity: amount,
            price: unitPrice,
            total,
          },
          occurredAt: new Date(),
        },
      ],
      { session },
    );

    await updateAllocation(userId, session);
    await snapshotPortfolio(userId, session);

    if (!externalSession) {
      await session.commitTransaction();
      session.endSession();
    }

    return getDashboardSnapshot(userId);
  } catch (error) {
    if (!externalSession) {
      await session.abortTransaction();
      session.endSession();
    }
    throw error;
  }
}

export async function queueTradeRequest(params) {
  const { normalizedSymbol, resolvedName, tradeSide, amount, unitPrice, total } = normalizeTradeInput(params);
  const userId = toObjectId(params.userId);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const wallet = await ensureWallet(userId, session);
    if (tradeSide === "buy") {
      const available = (wallet.balance ?? 0) - (wallet.pendingHold ?? 0);
      if (available < total) {
        throw new Error("INSUFFICIENT_FUNDS");
      }
      wallet.pendingHold = (wallet.pendingHold ?? 0) + total;
      await wallet.save({ session });
    } else {
      const position = await PositionModel.findOne({ userId, symbol: normalizedSymbol }).session(session).exec();
      if (!position || position.amount - (position.pendingSell ?? 0) < amount) {
        throw new Error("INSUFFICIENT_POSITION");
      }
      position.pendingSell = (position.pendingSell ?? 0) + amount;
      await position.save({ session });
    }

    const [transaction] = await TransactionModel.create(
      [
        {
          userId,
          type: "trade",
          asset: resolvedName,
          symbol: normalizedSymbol,
          amount,
          price: unitPrice,
          total,
          status: "pending",
          direction: tradeSide === "buy" ? "out" : "in",
          metadata: { side: tradeSide, requiresApproval: true },
          occurredOn: new Date(),
        },
      ],
      { session },
    );

    await OperationLogModel.create(
      [
        {
          userId,
          actorId: userId,
          type: "trade",
          action: "trade_request_submitted",
          context: {
            transactionId: transaction._id,
            symbol: normalizedSymbol,
            name: resolvedName,
            quantity: amount,
            price: unitPrice,
            total,
          },
          occurredAt: new Date(),
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    // Create notifications AFTER transaction commits (so they don't break the trade flow)
    // Create notification for pending trade (user)
    try {
      await createNotification({
        userId,
        type: "pending",
        title: `${tradeSide === "buy" ? "Buy" : "Sell"} order queued`,
        body: `Your order to ${tradeSide} ${amount} shares of ${resolvedName} at $${unitPrice.toFixed(2)} per share is pending admin approval.`,
        metadata: {
          transactionId: transaction._id,
          symbol: normalizedSymbol,
          side: tradeSide,
          amount,
          total,
        },
      });
    } catch (notifError) {
      logger.error({ err: notifError }, "Failed to create user trade notification");
    }

    // Create notification for admin
    try {
      const adminUsers = await UserModel.find({ role: "admin" })
        .select("_id")
        .lean()
        .exec();
      
      for (const admin of adminUsers) {
        await createNotification({
          userId: admin._id,
          type: "info",
          title: `New ${tradeSide} order request`,
          body: `User wants to ${tradeSide} ${amount} shares of ${resolvedName} at $${unitPrice.toFixed(2)} per share (Total: $${total.toFixed(2)}). Pending your approval.`,
          metadata: {
            transactionId: transaction._id,
            requestingUserId: userId.toString(),
            symbol: normalizedSymbol,
            side: tradeSide,
            amount,
            unitPrice,
            total,
            requiresAction: true,
            actionType: "trade_approval",
          },
        });
      }
    } catch (notifError) {
      logger.error({ err: notifError }, "Failed to create admin trade notification");
    }

    return transaction.toObject();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

export async function approvePendingTrade({ transactionId, adminId, note }) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const transaction = await TransactionModel.findById(transactionId).session(session).exec();
    if (!transaction) throw new Error("TRANSACTION_NOT_FOUND");
    if (transaction.status !== "pending") throw new Error("TRANSACTION_ALREADY_PROCESSED");
    if (transaction.type !== "trade") throw new Error("TRANSACTION_NOT_TRADE");

    // Get the trade side from metadata
    const tradeSide = transaction.metadata?.side || "buy";
    
    if (tradeSide === "buy") {
      const wallet = await ensureWallet(transaction.userId, session);
      if ((wallet.pendingHold ?? 0) < transaction.total) {
        throw new Error("INSUFFICIENT_FUNDS");
      }
      wallet.pendingHold -= transaction.total;
      await wallet.save({ session });
    } else {
      const position = await PositionModel.findOne({ userId: transaction.userId, symbol: transaction.symbol })
        .session(session)
        .exec();
      if (!position || (position.pendingSell ?? 0) < transaction.amount) {
        throw new Error("INSUFFICIENT_POSITION");
      }
      position.pendingSell -= transaction.amount;
      await position.save({ session });
    }

    await executeTrade(
      {
        userId: transaction.userId,
        symbol: transaction.symbol,
        name: transaction.asset,
        side: tradeSide,
        quantity: transaction.amount,
        price: transaction.price,
      },
      { session },
    );

    transaction.status = "completed";
    transaction.completedAt = new Date();
    transaction.adminNote = note ?? "";
    transaction.metadata = {
      ...(transaction.metadata ?? {}),
      approvedBy: adminId ? adminId.toString() : undefined,
      approvedAt: transaction.completedAt,
    };
    await transaction.save({ session });

    await OperationLogModel.create(
      [
        {
          userId: transaction.userId,
          actorId: adminId,
          type: "trade",
          action: "trade_request_approved",
          context: {
            transactionId: transaction._id,
            symbol: transaction.symbol,
            name: transaction.asset,
            quantity: transaction.amount,
            price: transaction.price,
            total: transaction.total,
          },
          occurredAt: transaction.completedAt,
        },
      ],
      { session },
    );

    // Create notification for approved trade
    try {
      await createNotification({
        userId: transaction.userId,
        type: "success",
        title: `${tradeSide === "buy" ? "Buy" : "Sell"} order processed`,
        body: `Your order to ${tradeSide} ${transaction.amount} shares of ${transaction.asset} at $${transaction.price.toFixed(2)} per share has been executed. $${transaction.total.toFixed(2)} has been ${tradeSide === "buy" ? "deducted from" : "added to"} your balance.`,
        metadata: {
          transactionId: transaction._id,
          symbol: transaction.symbol,
          side: tradeSide,
          amount: transaction.amount,
          total: transaction.total,
        },
      });
    } catch (notifError) {
      logger.error({ err: notifError }, "Failed to create trade approval notification");
    }

    await session.commitTransaction();
    session.endSession();
    return transaction.toObject();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

export async function rejectPendingTrade({ transactionId, adminId, reason }) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const transaction = await TransactionModel.findById(transactionId).session(session).exec();
    if (!transaction) throw new Error("TRANSACTION_NOT_FOUND");
    if (transaction.status !== "pending") throw new Error("TRANSACTION_ALREADY_PROCESSED");

    // Get the trade side from metadata
    const tradeSide = transaction.metadata?.side || "buy";

    if (tradeSide === "buy") {
      const wallet = await ensureWallet(transaction.userId, session);
      wallet.pendingHold = Math.max((wallet.pendingHold ?? 0) - transaction.total, 0);
      await wallet.save({ session });
    } else if (tradeSide === "sell") {
      const position = await PositionModel.findOne({ userId: transaction.userId, symbol: transaction.symbol })
        .session(session)
        .exec();
      if (position) {
        position.pendingSell = Math.max((position.pendingSell ?? 0) - transaction.amount, 0);
        await position.save({ session });
      }
    }

    transaction.status = "rejected";
    transaction.completedAt = new Date();
    transaction.adminNote = reason ?? "";
    transaction.metadata = {
      ...(transaction.metadata ?? {}),
      rejectedBy: adminId ? adminId.toString() : undefined,
      rejectedAt: transaction.completedAt,
    };
    await transaction.save({ session });

    await OperationLogModel.create(
      [
        {
          userId: transaction.userId,
          actorId: adminId,
          type: "trade",
          action: "trade_request_rejected",
          context: {
            transactionId: transaction._id,
            symbol: transaction.symbol,
            name: transaction.asset,
            quantity: transaction.amount,
            price: transaction.price,
            total: transaction.total,
            reason,
          },
          occurredAt: transaction.completedAt,
        },
      ],
      { session },
    );

    // Create notification for rejected trade
    try {
      await createNotification({
        userId: transaction.userId,
        type: "error",
        title: `${tradeSide === "buy" ? "Buy" : "Sell"} order terminated`,
        body: `Your order to ${tradeSide} ${transaction.amount} shares of ${transaction.asset} has been terminated by an administrator. ${reason ? `Reason: ${reason}` : ""}`,
        metadata: {
          transactionId: transaction._id,
          symbol: transaction.symbol,
          side: transaction.type.toLowerCase(),
          amount: transaction.amount,
          total: transaction.total,
          reason,
        },
      });
    } catch (notifError) {
      logger.error({ err: notifError }, "Failed to create trade rejection notification");
    }

    await session.commitTransaction();
    session.endSession();
    return transaction.toObject();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}
