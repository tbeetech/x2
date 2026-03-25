import bcrypt from "bcryptjs";
import {
  sampleUser,
  sampleUserStore,
  samplePortfolioSummary,
  sampleWallet,
  samplePositions,
  sampleTransactions,
  sampleVerificationTimeline,
  sampleMarketTop,
} from "../data/sample.js";
import { getUserNotifications } from "./notificationService.js";
import { updatePortfolioGrowth } from "./portfolioGrowthService.js";
import { VerificationDocumentModel } from "../models/VerificationDocument.js";
import { env } from "../config/env.js";
import { UserModel } from "../models/User.js";
import { PortfolioSnapshotModel } from "../models/PortfolioSnapshot.js";
import { PositionModel } from "../models/Position.js";
import { TransactionModel } from "../models/Transaction.js";
import { WalletModel } from "../models/Wallet.js";
import { VerificationEventModel } from "../models/VerificationEvent.js";
import { MarketAssetModel } from "../models/MarketAsset.js";
import { refreshMarketData } from "./marketDataService.js";
import { isValidObjectId } from "../lib/objectId.js";

function mapTransactionDocument(doc) {
  return {
    id: doc._id?.toString?.() ?? doc.id,
    type: doc.type,
    asset: doc.asset,
    symbol: doc.symbol,
    amount: doc.amount,
    price: doc.price,
    total: doc.total,
    status: doc.status,
    direction: doc.direction,
    method: doc.method,
    reference: doc.reference,
    metadata: doc.metadata ?? {},
    requestedAt: doc.createdAt ?? doc.occurredOn,
    occurredOn: doc.occurredOn,
    completedAt: doc.completedAt ?? doc.updatedAt,
  };
}

function mapPositionDocument(doc) {
  return {
    id: doc._id?.toString?.() ?? doc.id,
    symbol: doc.symbol,
    name: doc.name,
    allocation: Number(doc.allocation ?? 0),
    amount: Number(doc.amount ?? 0),
    averagePrice: Number(doc.averagePrice ?? 0),
    currentValue: Number(doc.currentValue ?? 0),
    pnl: Number(doc.pnl ?? 0),
    pnlPercent: Number(doc.pnlPercent ?? 0),
  };
}

function mapVerificationDocument(doc) {
  return {
    id: doc._id?.toString?.() ?? doc.id,
    userId: doc.userId?.toString?.() ?? doc.userId,
    status: doc.status,
    timestamp: doc.timestamp,
    document: doc.document,
    step: doc.step,
    outcome: doc.outcome,
    notes: doc.notes,
    reviewedBy: doc.reviewedBy,
  };
}

function mapNotificationDocument(doc) {
  return {
    id: doc._id?.toString?.() ?? doc.id,
    userId: doc.userId?.toString?.() ?? doc.userId,
    type: doc.type,
    title: doc.title,
    body: doc.body,
    read: doc.read,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
  };
}

const EMPTY_SUMMARY = {
  totalValue: 0,
  totalReturn: 0,
  dailyChange: 0,
  netDeposits: 0,
};

const EMPTY_WALLET = {
  balance: 0,
  totalDeposited: 0,
  totalWithdrawn: 0,
  earningRate: 0,
};

function mapSampleUser(user = sampleUser) {
  const {
    password: UNUSED_PASSWORD,
    passwordHash,
    ...rest
  } = user;
  // Ensure default fields exist so controllers can rely on them
  return {
    id: rest.id ?? rest._id ?? sampleUser.id,
    email: rest.email,
    firstName: rest.firstName,
    lastName: rest.lastName,
    role: rest.role ?? "user",
    membership: rest.membership ?? "Member",
    country: rest.country ?? "",
    createdAt: rest.createdAt ?? new Date().toISOString(),
    // authentication/account control fields
    loginAttempts: rest.loginAttempts ?? 0,
    lockoutUntil: rest.lockoutUntil ?? null,
    lastLogin: rest.lastLogin ?? null,
    verificationStatus: rest.verificationStatus ?? "pending",
    bonusPoints: rest.bonusPoints ?? 0,
    // include passwordHash internally for verification flows
    passwordHash: passwordHash ?? null,
  };
}

export async function resolveUserByEmail(email) {
  if (env.useSampleData) {
    const match = sampleUserStore.find(
      (candidate) => candidate.email.toLowerCase() === email.toLowerCase(),
    );
    if (!match) return null;
    const hash = await bcrypt.hash(match.password, 8);
    // Return a normalized user shape for controllers
    const normalized = { ...match, passwordHash: hash };
    return mapSampleUser(normalized);
  }

  return UserModel.findOne({ email }).exec();
}

export async function createUser(payload) {
  const passwordHash = await bcrypt.hash(payload.password, 10);

  if (env.useSampleData) {
    const record = {
      id: `user-${sampleUserStore.length + 1}`,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      country: payload.country ?? "",
      membership: "Member",
      role: "user",
      passwordHash,
      password: payload.password,
      createdAt: new Date().toISOString(),
    };
    sampleUserStore.push(record);
    return mapSampleUser(record);
  }

  const user = await UserModel.create({
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    country: payload.country,
    passwordHash,
    role: "user",
    membership: "Member",
  });

  return user;
}

export async function getDashboardSnapshot(userId) {
  if (shouldUseSampleDataForUser(userId)) {
    const user = sampleUserStore.find((candidate) => candidate.id === userId);
    return {
      user: user ? mapSampleUser(user) : null,
      summary: samplePortfolioSummary,
      wallet: sampleWallet,
      positions: samplePositions,
      transactions: sampleTransactions,
      verification: sampleVerificationTimeline,
    };
  }

  // Update portfolio growth before fetching snapshot
  try {
    await updatePortfolioGrowth(userId);
  } catch (error) {
    // Log error but don't fail the dashboard request
    console.error(`Failed to update portfolio growth for user ${userId}:`, error);
  }

  const [user, summary, wallet, positions, transactions, verification, notifications] = await Promise.all([
    UserModel.findById(userId).select("-passwordHash").lean().exec(),
    PortfolioSnapshotModel.findOne({ userId }).sort({ createdAt: -1 }).lean().exec(),
    WalletModel.findOne({ userId }).lean().exec(),
    PositionModel.find({ userId }).sort({ allocation: -1 }).lean().exec(),
    TransactionModel.find({ userId }).sort({ occurredOn: -1 }).limit(20).lean().exec(),
    VerificationEventModel.find({ userId }).sort({ timestamp: -1 }).lean().exec(),
    getUserNotifications(userId, { limit: 20 }),
  ]);

  return {
    user: user ?? null,
    summary: summary ?? EMPTY_SUMMARY,
    wallet: wallet ?? EMPTY_WALLET,
    positions: (positions ?? []).map(mapPositionDocument),
    transactions: (transactions ?? []).map(mapTransactionDocument),
    verification: (verification ?? []).map(mapVerificationDocument),
    notifications: (notifications ?? []).map(mapNotificationDocument),
  };
}

export async function getUserById(userId) {
  if (shouldUseSampleDataForUser(userId)) {
    const match = sampleUserStore.find((candidate) => candidate.id === userId);
    if (!match) return null;
    return mapSampleUser(match);
  }
  return UserModel.findById(userId).lean().exec();
}

export async function getPortfolioPositions(userId) {
  if (shouldUseSampleDataForUser(userId)) {
    return samplePositions;
  }
  const positions = await PositionModel.find({ userId }).sort({ allocation: -1 }).lean().exec();
  return positions.map(mapPositionDocument);
}

export async function getTransactions(userId) {
  if (shouldUseSampleDataForUser(userId)) {
    return sampleTransactions;
  }
  const transactions = await TransactionModel.find({ userId }).sort({ occurredOn: -1 }).lean().exec();
  return transactions.map(mapTransactionDocument);
}

export async function getVerificationTimeline(userId) {
  if (shouldUseSampleDataForUser(userId)) {
    return sampleVerificationTimeline;
  }
  const events = await VerificationEventModel.find({ userId }).sort({ timestamp: -1 }).lean().exec();
  return events.map(mapVerificationDocument);
}

export async function getWallet(userId) {
  if (shouldUseSampleDataForUser(userId)) {
    return sampleWallet;
  }
  const wallet = await WalletModel.findOne({ userId }).lean().exec();
  return wallet ?? EMPTY_WALLET;
}

export async function getMarketTop() {
  if (env.useSampleData) {
    return sampleMarketTop;
  }

  const cached = await MarketAssetModel.find()
    .sort({ marketCap: -1, updatedAt: -1 })
    .limit(25)
    .lean()
    .exec();
  if (cached.length) {
    return cached;
  }

  const refreshed = await refreshMarketData({ limit: 25 }).catch(() => []);
  return refreshed;
}

export async function updateUser(userId, updates = {}) {
  if (!userId) return null;
  if (shouldUseSampleDataForUser(userId)) {
    const target = sampleUserStore.find((candidate) => (candidate.id ?? candidate._id?.toString?.()) === userId);
    if (!target) return null;

    // If password update provided, hash it for consistency
    if (updates.password) {
      // hash synchronously is fine for tests but keep async to match DB path
      const passwordHash = await bcrypt.hash(updates.password, 10);
      target.password = updates.password;
      target.passwordHash = passwordHash;
      delete updates.password;
    }

    Object.assign(target, updates);
    return mapSampleUser(target);
  }

  // For DB-backed users, apply updates via Mongoose
  if (!isValidObjectId(userId)) {
    return null;
  }

  const dbUpdates = { ...updates };
  if (dbUpdates.password) {
    // hash password and set passwordHash, remove raw password
    const passwordHash = await bcrypt.hash(dbUpdates.password, 10);
    dbUpdates.passwordHash = passwordHash;
    delete dbUpdates.password;
  }

  const updated = await UserModel.findByIdAndUpdate(userId, { $set: dbUpdates }, { new: true }).lean().exec();
  return updated;
}
const shouldUseSampleDataForUser = (userId) => env.useSampleData || !isValidObjectId(userId);
