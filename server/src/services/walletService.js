import mongoose from "mongoose";
import { WalletModel } from "../models/Wallet.js";
import { TransactionModel } from "../models/Transaction.js";
import { OperationLogModel } from "../models/OperationLog.js";
import { PortfolioSnapshotModel } from "../models/PortfolioSnapshot.js";
import { PositionModel } from "../models/Position.js";
import { UserModel } from "../models/User.js";
import { getDashboardSnapshot } from "./dataService.js";
import { createNotification } from "./notificationService.js";

const { Types } = mongoose;

const DEFAULT_CRYPTO_OPTIONS = [
  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    network: "Bitcoin",
    minAmountUsd: 250,
    description: "SegWit-compatible treasury address for BTC settlements.",
    addresses: [
      {
        id: "btc-primary",
        label: "Invisphere BTC Treasury",
        address: "bc1qm9pn705jdjxa6vmhp2csresuu92gp9wcy4r6el",
        deeplink: "https://link.trustwallet.com/send?coin=0&address=bc1qm9pn705jdjxa6vmhp2csresuu92gp9wcy4r6el",
      },
    ],
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    network: "Ethereum",
    minAmountUsd: 250,
    description: "Main Invisphere hot wallet for ETH contributions.",
    addresses: [
      {
        id: "eth-primary",
        label: "Invisphere ETH Treasury",
        address: "0x2A83B6316254e07876d42D434fBF365854a4Fd27",
        deeplink: "https://link.trustwallet.com/send?coin=60&address=0x2A83B6316254e07876d42D434fBF365854a4Fd27",
      },
    ],
  },
  {
    id: "usdc",
    symbol: "USDC",
    name: "USD Coin",
    network: "Ethereum",
    minAmountUsd: 250,
    description: "ERC-20 USDC address for dollar-pegged settlements.",
    addresses: [
      {
        id: "usdc-primary",
        label: "Invisphere USDC",
        address: "0x2A83B6316254e07876d42D434fBF365854a4Fd27",
        deeplink: "https://link.trustwallet.com/send?coin=60&address=0x2A83B6316254e07876d42D434fBF365854a4Fd27&token_id=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      },
    ],
  },
  {
    id: "usdt",
    symbol: "USDT",
    name: "Tether USD",
    network: "Ethereum",
    minAmountUsd: 250,
    description: "USDT (ERC-20) address for stablecoin deposits.",
    addresses: [
      {
        id: "usdt-primary",
        label: "Invisphere USDT",
        address: "0x2A83B6316254e07876d42D434fBF365854a4Fd27",
        deeplink: "https://link.trustwallet.com/send?coin=60&address=0x2A83B6316254e07876d42D434fBF365854a4Fd27&token_id=0xdAC17F958D2ee523a2206206994597C13D831ec7",
      },
    ],
  },
  {
    id: "sol",
    symbol: "SOL",
    name: "Solana",
    network: "Solana",
    minAmountUsd: 250,
    description: "Primary Solana program wallet for SOL payments.",
    addresses: [
      {
        id: "sol-primary",
        label: "Invisphere SOL",
        address: "GrTwBor6VWsKbRgpfSfkLzb7T5Zn57jf4a3fENiobY5r",
        deeplink: "https://link.trustwallet.com/send?coin=501&address=GrTwBor6VWsKbRgpfSfkLzb7T5Zn57jf4a3fENiobY5r",
      },
    ],
  },
  {
    id: "xrp",
    symbol: "XRP",
    name: "XRP",
    network: "Ripple",
    minAmountUsd: 250,
    description: "Ripple network wallet for XRP settlements.",
    addresses: [
      {
        id: "xrp-primary",
        label: "Invisphere XRP",
        address: "rfjJ8jW2nYdH6fjosNuMetRrqiPXP29xsQ",
        deeplink: "https://link.trustwallet.com/send?coin=144&address=rfjJ8jW2nYdH6fjosNuMetRrqiPXP29xsQ",
      },
    ],
  },
  {
    id: "xmr",
    symbol: "XMR",
    name: "Monero",
    network: "Monero",
    minAmountUsd: 500,
    description: "Privacy-preserving Monero wallet (Trust Wallet compatible).",
    addresses: [
      {
        id: "xmr-primary",
        label: "Invisphere XMR",
        address: "GrTwBor6VWsKbRgpfSfkLzb7T5Zn57jf4a3fENiobY5r",
        deeplink: "https://link.trustwallet.com/send?coin=501&address=GrTwBor6VWsKbRgpfSfkLzb7T5Zn57jf4a3fENiobY5r&token_id=2JyjpmsaLLQpRVzHWgtobTF91Ao1PDK3rrgPZnjD6Wmg",
      },
    ],
  },
  {
    id: "monerochan",
    symbol: "MONEROCHAN",
    name: "Monerochan",
    network: "Ethereum",
    minAmountUsd: 100,
    description: "ERC-20 Monerochan token allocation address.",
    addresses: [
      {
        id: "monerochan-primary",
        label: "Invisphere Monerochan",
        address: "0x2A83B6316254e07876d42D434fBF365854a4Fd27",
        deeplink: "https://link.trustwallet.com/send?coin=60&address=0x2A83B6316254e07876d42D434fBF365854a4Fd27&token_id=0x3f7dB133aFf2F012C8534b36aB9731fe9Ee7bd43",
      },
    ],
  },
];

function toObjectId(value) {
  if (value instanceof Types.ObjectId) return value;
  return new Types.ObjectId(value);
}

async function ensureWallet(userId, session) {
  const wallet = await WalletModel.findOneAndUpdate(
    { userId },
    { $setOnInsert: { balance: 0, totalDeposited: 0, totalWithdrawn: 0, earningRate: 0 } },
    { upsert: true, new: true, session },
  ).exec();
  return wallet;
}

async function snapshotPortfolio(userId, session) {
  const [wallet, positions] = await Promise.all([
    WalletModel.findOne({ userId }).session(session).lean().exec(),
    PositionModel.find({ userId }).session(session).lean().exec(),
  ]);

  const totalPositionValue = positions.reduce((acc, position) => acc + (position.currentValue ?? 0), 0);
  const totalValue = totalPositionValue + (wallet?.balance ?? 0);
  const netDeposits = (wallet?.totalDeposited ?? 0) - (wallet?.totalWithdrawn ?? 0);
  const totalReturn = netDeposits > 0 ? ((totalValue - netDeposits) / netDeposits) * 100 : 0;

  await PortfolioSnapshotModel.create(
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
}

export async function depositFunds({ userId: rawUserId, amount, assetSymbol, assetName, walletAddress, walletLabel, network, reference, method }) {
  const userId = toObjectId(rawUserId);
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("INVALID_AMOUNT");
  }
  // Queue deposit for admin approval (creates a pending transaction) instead of crediting immediately.
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const [transaction] = await TransactionModel.create(
      [
        {
          userId,
          type: "deposit",
          asset: assetName ?? "USD",
          symbol: (assetSymbol ?? "USD").toUpperCase(),
          amount: numericAmount,
          price: 1,
          total: numericAmount,
          status: "pending",
          direction: "in",
          method: method ?? "wire",
          reference,
          metadata: { 
            requiresApproval: true,
            walletAddress,
            walletLabel,
            network,
          },
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
          type: "transaction",
          action: "deposit_submitted",
          context: {
            amount: numericAmount,
            assetSymbol: assetSymbol ?? "USD",
            method: method ?? "wire",
            reference,
            transactionId: transaction._id,
          },
          occurredAt: new Date(),
        },
      ],
      { session },
    );

    await session.commitTransaction();
    
    // Create notification for user about pending deposit
    try {
      await createNotification({
        userId,
        type: "info",
        title: "Payment Processing",
        body: `Your ${assetSymbol ?? "USD"} deposit of $${numericAmount.toFixed(2)} is being processed. You'll be notified once it's approved.`,
        metadata: {
          transactionId: transaction._id,
          amount: numericAmount,
          assetSymbol: assetSymbol ?? "USD",
        },
      });

      // Create notification for admin about new deposit request
      const adminUsers = await UserModel.find({ role: "admin" }).select("_id").lean().exec();
      
      for (const admin of adminUsers) {
        await createNotification({
          userId: admin._id,
          type: "info",
          title: "New deposit request",
          body: `User is depositing $${numericAmount.toFixed(2)} (${assetSymbol ?? "USD"}). Pending your approval.`,
          metadata: {
            transactionId: transaction._id,
            requestingUserId: userId.toString(),
            amount: numericAmount,
            assetSymbol: assetSymbol ?? "USD",
            requiresAction: true,
            actionType: "deposit_approval",
          },
        });
      }
    } catch (notifError) {
      // Don't fail the deposit if notification creation fails
      console.error("Failed to create deposit notification:", notifError);
    }
    
    const dashboard = await getDashboardSnapshot(userId);
    return { transaction: transaction.toObject(), dashboard };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function approvePendingDeposit({ transactionId, adminId, note }) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    console.log('approvePendingDeposit called with:', { transactionId, adminId, note });
    
    const transaction = await TransactionModel.findById(transactionId).session(session).exec();
    if (!transaction) {
      console.error('Transaction not found:', transactionId);
      throw new Error("TRANSACTION_NOT_FOUND");
    }
    if (transaction.status !== "pending") {
      console.error('Transaction already processed:', transaction.status);
      throw new Error("TRANSACTION_ALREADY_PROCESSED");
    }
    if (transaction.type !== "deposit") {
      console.error('Transaction is not a deposit:', transaction.type);
      throw new Error("TRANSACTION_NOT_DEPOSIT");
    }

    const userId = transaction.userId;
    console.log('Finding wallet for userId:', userId);
    const wallet = await ensureWallet(userId, session);
    console.log('Wallet found/created, current balance:', wallet.balance);
    
    // Credit user's wallet balance
    wallet.balance += transaction.total;
    wallet.totalDeposited += transaction.total;
    await wallet.save({ session });
    console.log('Wallet updated, new balance:', wallet.balance);

    // Update transaction status
    transaction.status = "completed";
    transaction.completedAt = new Date();
    transaction.adminNote = note ?? "";
    transaction.metadata = { 
      ...(transaction.metadata ?? {}), 
      approvedBy: adminId ? adminId.toString() : undefined, 
      approvedAt: transaction.completedAt 
    };
    await transaction.save({ session });
    console.log('Transaction updated to completed');

    await OperationLogModel.create(
      [
        {
          userId,
          actorId: adminId,
          type: "transaction",
          action: "deposit_approved",
          context: {
            transactionId: transaction._id,
            amount: transaction.total,
            reference: transaction.reference,
          },
          occurredAt: transaction.completedAt,
        },
      ],
      { session },
    );
    console.log('Operation log created');

    await snapshotPortfolio(userId, session);
    console.log('Portfolio snapshot created');

    await session.commitTransaction();
    console.log('Transaction committed successfully');
    
    // Create notification for user about approved deposit
    try {
      await createNotification({
        userId,
        type: "success",
        title: "Deposit Confirmed",
        body: `Your deposit of $${transaction.total.toFixed(2)} (${transaction.symbol}) has been confirmed and credited to your wallet.`,
        metadata: {
          transactionId: transaction._id,
          amount: transaction.total,
          assetSymbol: transaction.symbol,
          newBalance: wallet.balance,
        },
      });
      
      // Emit real-time notification via Socket.IO
      if (global.io) {
        global.io.to(userId.toString()).emit('notification', {
          type: 'deposit_confirmed',
          title: 'Deposit Confirmed',
          message: `Your deposit of $${transaction.total.toFixed(2)} (${transaction.symbol}) has been confirmed.`,
          balance: wallet.balance,
          transaction: {
            id: transaction._id,
            amount: transaction.total,
            symbol: transaction.symbol,
            status: 'completed',
          },
        });
        
        // Emit balance update
        global.io.to(userId.toString()).emit('balance_update', {
          balance: wallet.balance,
          totalDeposited: wallet.totalDeposited,
          totalWithdrawn: wallet.totalWithdrawn,
        });
        
        // Emit transaction update
        global.io.to(userId.toString()).emit('transaction_update', {
          transaction: {
            id: transaction._id,
            type: 'deposit',
            status: 'completed',
            amount: transaction.total,
            symbol: transaction.symbol,
          },
        });
        
        // Notify all admin rooms that this transaction is processed
        global.io.to('admin-room').emit('admin_transaction_processed', {
          transactionId: transaction._id.toString(),
          type: 'deposit',
          status: 'completed',
          userId: userId.toString(),
          action: 'approved',
        });
      }
    } catch (notifError) {
      console.error("Failed to create approval notification:", notifError);
    }
    
    session.endSession();
    return transaction.toObject();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

export async function rejectPendingDeposit({ transactionId, adminId, reason }) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const transaction = await TransactionModel.findById(transactionId).session(session).exec();
    if (!transaction) throw new Error("TRANSACTION_NOT_FOUND");
    if (transaction.status !== "pending") throw new Error("TRANSACTION_ALREADY_PROCESSED");
    if (transaction.type !== "deposit") throw new Error("TRANSACTION_NOT_DEPOSIT");

    // Update transaction status to rejected
    transaction.status = "rejected";
    transaction.completedAt = new Date();
    transaction.adminNote = reason ?? "";
    transaction.failureReason = reason ?? "Rejected by admin";
    transaction.metadata = { 
      ...(transaction.metadata ?? {}), 
      rejectedBy: adminId ? adminId.toString() : undefined, 
      rejectedAt: transaction.completedAt 
    };
    await transaction.save({ session });

    await OperationLogModel.create(
      [
        {
          userId: transaction.userId,
          actorId: adminId,
          type: "transaction",
          action: "deposit_rejected",
          context: {
            transactionId: transaction._id,
            amount: transaction.total,
            reason,
          },
          occurredAt: transaction.completedAt,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    
    // Create notification for user about rejected deposit
    try {
      await createNotification({
        userId: transaction.userId,
        type: "error",
        title: "Deposit Declined",
        body: `Your deposit of $${transaction.total.toFixed(2)} (${transaction.symbol}) could not be confirmed. ${reason ? `Reason: ${reason}` : "Please contact support for assistance."}`,
        metadata: {
          transactionId: transaction._id,
          amount: transaction.total,
          assetSymbol: transaction.symbol,
          reason,
        },
      });
      
      // Emit real-time notification via Socket.IO
      if (global.io) {
        global.io.to(transaction.userId.toString()).emit('notification', {
          type: 'deposit_declined',
          title: 'Deposit Declined',
          message: `Your deposit of $${transaction.total.toFixed(2)} (${transaction.symbol}) was declined. ${reason ? `Reason: ${reason}` : ""}`,
          transaction: {
            id: transaction._id,
            amount: transaction.total,
            symbol: transaction.symbol,
            status: 'rejected',
            reason,
          },
        });
        
        // Emit transaction update
        global.io.to(transaction.userId.toString()).emit('transaction_update', {
          transaction: {
            id: transaction._id,
            type: 'deposit',
            status: 'rejected',
            amount: transaction.total,
            symbol: transaction.symbol,
            reason,
          },
        });
        
        // Notify all admin rooms that this transaction is processed
        global.io.to('admin-room').emit('admin_transaction_processed', {
          transactionId: transaction._id.toString(),
          type: 'deposit',
          status: 'rejected',
          userId: transaction.userId.toString(),
          action: 'rejected',
        });
      }
    } catch (notifError) {
      console.error("Failed to create rejection notification:", notifError);
    }
    
    session.endSession();
    return transaction.toObject();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

export async function withdrawFunds({ userId: rawUserId, amount, method, reference }) {
  const userId = toObjectId(rawUserId);
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const wallet = await ensureWallet(userId, session);
    if (wallet.balance < numericAmount) {
      throw new Error("INSUFFICIENT_FUNDS");
    }
    wallet.balance -= numericAmount;
    wallet.totalWithdrawn += numericAmount;
    await wallet.save({ session });

    await TransactionModel.create(
      [
        {
          userId,
          type: "withdrawal",
          asset: "USD",
          symbol: "USD",
          amount: numericAmount,
          price: 1,
          total: numericAmount,
          status: "completed",
          direction: "out",
          method: method ?? "wire",
          reference,
          occurredOn: new Date(),
          completedAt: new Date(),
        },
      ],
      { session },
    );

    await OperationLogModel.create(
      [
        {
          userId,
          actorId: userId,
          type: "transaction",
          action: "withdrawal_requested",
          context: {
            amount: numericAmount,
            method: method ?? "wire",
            reference,
          },
          occurredAt: new Date(),
        },
      ],
      { session },
    );

    await snapshotPortfolio(userId, session);
    await session.commitTransaction();
    session.endSession();
    return getDashboardSnapshot(userId);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

export async function transferFunds({ userId: rawUserId, amount, destination, memo }) {
  const userId = toObjectId(rawUserId);
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await ensureWallet(userId, session);

    await TransactionModel.create(
      [
        {
          userId,
          type: "Transfer",
          asset: "USD",
          symbol: "USD",
          amount: numericAmount,
          price: 1,
          total: numericAmount,
          status: "completed",
          direction: "internal",
          metadata: {
            destination,
            memo,
          },
          occurredOn: new Date(),
          completedAt: new Date(),
        },
      ],
      { session },
    );

    await OperationLogModel.create(
      [
        {
          userId,
          actorId: userId,
          type: "transaction",
          action: "internal_transfer_created",
          context: {
            amount: numericAmount,
            destination,
            memo,
          },
          occurredAt: new Date(),
        },
      ],
      { session },
    );

    await snapshotPortfolio(userId, session);
    await session.commitTransaction();
    session.endSession();
    return getDashboardSnapshot(userId);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

export function listCryptoDepositOptions() {
  return DEFAULT_CRYPTO_OPTIONS;
}
