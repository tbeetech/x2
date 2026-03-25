/**
 * Portfolio Growth Service
 * 
 * This service manages automatic portfolio growth calculations:
 * 1. Portfolio value is always 2.8% higher than wallet balance
 * 2. Portfolio value increases by 0.8% every hour
 * 3. Real-time synchronization with frontend via Socket.IO
 */

import mongoose from "mongoose";
import { WalletModel } from "../models/Wallet.js";
import { PortfolioSnapshotModel } from "../models/PortfolioSnapshot.js";
import { PositionModel } from "../models/Position.js";
import logger from "../lib/logger.js";
import { env } from "../config/env.js";
import { isValidObjectId } from "../lib/objectId.js";
import { isPrimaryWorker } from "../lib/processRole.js";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Constants for portfolio growth
const PORTFOLIO_PREMIUM_RATE = 0.028; // 2.8% higher than wallet
const HOURLY_GROWTH_RATE = 0.008; // 0.8% per hour

/**
 * Calculate the target portfolio value based on wallet balance
 * Portfolio should be 2.8% higher than wallet balance
 */
export function calculateTargetPortfolioValue(walletBalance) {
  return walletBalance * (1 + PORTFOLIO_PREMIUM_RATE);
}

/**
 * Calculate hourly growth for a portfolio value
 * Increases by 0.8% every hour
 */
export function calculateHourlyGrowth(currentValue) {
  return currentValue * HOURLY_GROWTH_RATE;
}

/**
 * Update portfolio snapshot with growth calculations
 * Includes retry logic for MongoDB write conflicts
 */
export async function updatePortfolioGrowth(userId, retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 100;

  if (env.useSampleData) {
    logger.debug("Skipping portfolio growth update in sample data mode.");
    return null;
  }

  if (!isValidObjectId(userId)) {
    logger.warn({ userId }, "Skipping portfolio growth update for invalid user id.");
    return null;
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get current wallet balance
    const wallet = await WalletModel.findOne({ userId }).session(session).exec();
    if (!wallet) {
      logger.warn(`No wallet found for user ${userId}`);
      await session.abortTransaction();
      session.endSession();
      return null;
    }
    const walletBalance = toNumber(wallet.balance);

    // Get all positions to calculate total position value
    const positions = await PositionModel.find({ userId }).session(session).exec();
    const totalPositionValue = positions.reduce(
      (sum, pos) => sum + toNumber(pos.currentValue),
      0,
    );

    // Get latest portfolio snapshot
    const latestSnapshot = await PortfolioSnapshotModel.findOne({ userId })
      .sort({ createdAt: -1 })
      .session(session)
      .exec();

    // Calculate time difference in hours since last snapshot
    const now = new Date();
    const hoursSinceLastUpdate = latestSnapshot
      ? (now - latestSnapshot.createdAt) / (1000 * 60 * 60)
      : 0;

    // Calculate new portfolio value
    let newPortfolioValue;
    
    if (!latestSnapshot || hoursSinceLastUpdate >= 1) {
      // Calculate base portfolio value (2.8% higher than wallet balance)
      const basePortfolioValue = calculateTargetPortfolioValue(walletBalance);
      
      // Add position values to the base
      newPortfolioValue = basePortfolioValue + totalPositionValue;
      
      // Apply hourly growth if applicable
      if (latestSnapshot && hoursSinceLastUpdate >= 1) {
        const hoursToApply = Math.floor(hoursSinceLastUpdate);
        const growthRate = Math.pow(1 + HOURLY_GROWTH_RATE, hoursToApply);
        newPortfolioValue = toNumber(latestSnapshot.totalValue, walletBalance) * growthRate;
      }
    } else {
      // Use existing value if less than an hour has passed
      newPortfolioValue = toNumber(latestSnapshot.totalValue, walletBalance);
    }

    newPortfolioValue = toNumber(newPortfolioValue, walletBalance + totalPositionValue);

    // Calculate net deposits
    const netDeposits = toNumber(wallet.totalDeposited) - toNumber(wallet.totalWithdrawn);
    
    // Calculate total return percentage
    const totalReturn =
      netDeposits > 0 ? ((newPortfolioValue - netDeposits) / netDeposits) * 100 : 0;

    // Calculate daily change
    const previousValue = toNumber(latestSnapshot?.totalValue, null);
    const dailyChange =
      previousValue && previousValue !== 0
        ? ((newPortfolioValue - previousValue) / previousValue) * 100
        : 0;

    const safeSnapshot = {
      totalValue: toNumber(newPortfolioValue),
      totalReturn: toNumber(totalReturn),
      dailyChange: toNumber(dailyChange),
      netDeposits: toNumber(netDeposits),
    };

    // Create or update portfolio snapshot
    const snapshot = await PortfolioSnapshotModel.findOneAndUpdate(
      { userId },
      {
        userId,
        totalValue: safeSnapshot.totalValue,
        totalReturn: safeSnapshot.totalReturn,
        dailyChange: safeSnapshot.dailyChange,
        netDeposits: safeSnapshot.netDeposits,
        updatedAt: now,
      },
      {
        upsert: true,
        new: true,
        session,
      }
    );

    await session.commitTransaction();
    session.endSession();

    logger.info(`Portfolio growth updated for user ${userId}`, {
      portfolioValue: safeSnapshot.totalValue,
      walletBalance: walletBalance,
      netDeposits: safeSnapshot.netDeposits,
      totalReturn: safeSnapshot.totalReturn,
      dailyChange: safeSnapshot.dailyChange,
    });

    // Emit real-time update via Socket.IO if available
    if (global.io) {
      global.io.to(userId.toString()).emit('portfolio_update', {
        summary: safeSnapshot,
        wallet: {
          balance: walletBalance,
          totalDeposited: toNumber(wallet.totalDeposited),
          totalWithdrawn: toNumber(wallet.totalWithdrawn),
        },
      });
    }

    return snapshot;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    // Check if this is a MongoDB write conflict (transient error)
    // Check both error.code and error.errorResponse for compatibility
    const isWriteConflict = (
      (error.code === 112 || error.errorResponse?.code === 112) &&
      (error.codeName === 'WriteConflict' || error.errorResponse?.codeName === 'WriteConflict')
    );
    
    if (isWriteConflict && retryCount < MAX_RETRIES) {
      logger.warn(`Write conflict for user ${userId}, retrying (attempt ${retryCount + 1}/${MAX_RETRIES}). Error code: ${error.code}, codeName: ${error.codeName}`);
      
      // Exponential backoff: wait longer on each retry
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the operation
      return updatePortfolioGrowth(userId, retryCount + 1);
    }
    
    logger.error(`Failed to update portfolio growth for user ${userId}`, error);
    throw error;
  }
}

/**
 * Update portfolio growth for all active users
 */
export async function updateAllPortfolioGrowth() {
  if (env.useSampleData) {
    logger.debug("Skipping bulk portfolio growth update in sample data mode.");
    return { total: 0, successful: 0, failed: 0 };
  }
  try {
    // Get all users with wallets
    const wallets = await WalletModel.find({ balance: { $gt: 0 } }).lean().exec();
    
    logger.info(`Starting portfolio growth update for ${wallets.length} users`);
    
    const results = await Promise.allSettled(
      wallets.map(wallet => updatePortfolioGrowth(wallet.userId))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logger.info(`Portfolio growth update completed`, {
      total: wallets.length,
      successful,
      failed,
    });

    return { total: wallets.length, successful, failed };
  } catch (error) {
    logger.error('Failed to update all portfolio growth', error);
    throw error;
  }
}

/**
 * Start the hourly portfolio growth scheduler
 */
export function startPortfolioGrowthScheduler() {
  if (env.useSampleData) {
    logger.info("Portfolio growth scheduler not started (sample data mode).");
    return () => {};
  }

  if (!isPrimaryWorker()) {
    logger.info(
      { worker: process.env.pm_id ?? process.env.NODE_APP_INSTANCE ?? process.pid },
      "Skipping portfolio growth scheduler in secondary worker.",
    );
    return () => {};
  }
  // Run immediately on startup
  updateAllPortfolioGrowth().catch(err => {
    logger.error('Initial portfolio growth update failed', err);
  });

  // Schedule to run every hour
  const interval = setInterval(() => {
    updateAllPortfolioGrowth().catch(err => {
      logger.error('Scheduled portfolio growth update failed', err);
    });
  }, 60 * 60 * 1000); // Every hour

  logger.info('Portfolio growth scheduler started (runs every hour)');

  // Return cleanup function
  return () => {
    clearInterval(interval);
    logger.info('Portfolio growth scheduler stopped');
  };
}
