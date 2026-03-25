import { UserModel } from "../models/User.js";
import { WalletModel } from "../models/Wallet.js";
import { PortfolioSnapshotModel } from "../models/PortfolioSnapshot.js";
import { TransactionModel } from "../models/Transaction.js";
import { VerificationEventModel } from "../models/VerificationEvent.js";
import { MarketAssetModel } from "../models/MarketAsset.js";
import { OperationLogModel } from "../models/OperationLog.js";

function toStringId(value) {
  return value?.toString();
}

function groupLatestByUserId(documents = []) {
  const map = new Map();
  for (const doc of documents) {
    const userId = toStringId(doc.userId);
    if (!userId) continue;
    if (map.has(userId)) continue;
    map.set(userId, doc);
  }
  return map;
}

export async function buildAdminOverview() {
  const users = await UserModel.find({ role: { $ne: "superadmin" } })
    .select("firstName lastName email role membership bonusPoints verificationStatus isActive createdAt")
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  const userIds = users.map((user) => user._id);
  if (userIds.length === 0) {
    return {
      pendingTransactions: [],
      verificationQueue: [],
      users: [],
      tokens: [],
    };
  }

  const [wallets, snapshots, pendingTransactions, verificationEvents, tokens, operations] = await Promise.all([
    WalletModel.find({ userId: { $in: userIds } }).lean().exec(),
    PortfolioSnapshotModel.find({ userId: { $in: userIds } }).sort({ createdAt: -1 }).lean().exec(),
    TransactionModel.find({ userId: { $in: userIds }, status: "pending" }).sort({ createdAt: -1 }).limit(50).lean().exec(),
    VerificationEventModel.find({ userId: { $in: userIds }, status: { $ne: "completed" } })
      .sort({ timestamp: -1 })
      .lean()
      .exec(),
    MarketAssetModel.find().sort({ updatedAt: -1 }).limit(12).lean().exec(),
    OperationLogModel.find({ userId: { $in: userIds } })
      .sort({ occurredAt: -1 })
      .limit(200)
      .lean()
      .exec(),
  ]);

  const walletByUser = new Map(wallets.map((wallet) => [toStringId(wallet.userId), wallet]));
  const summaryByUser = groupLatestByUserId(snapshots);
  const verificationByUser = groupLatestByUserId(verificationEvents);
  const userIndex = new Map(users.map((user) => [toStringId(user._id), user]));

  const pending = pendingTransactions.map((transaction) => {
    const user = userIndex.get(toStringId(transaction.userId));
    return {
      transaction: {
        id: toStringId(transaction._id),
        type: transaction.type,
        asset: transaction.asset,
        symbol: transaction.symbol,
        total: transaction.total,
        amount: transaction.amount,
        price: transaction.price,
        status: transaction.status,
        requestedAt: transaction.createdAt ?? transaction.occurredOn,
      },
      user: user
        ? {
            id: toStringId(user._id),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
          }
        : {
            id: toStringId(transaction.userId),
          },
    };
  });

  const verificationQueue = users
    .filter((user) => (user.verificationStatus ?? "pending") !== "approved")
    .map((user) => {
      const event = verificationByUser.get(toStringId(user._id));
      return {
        id: toStringId(user._id),
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        verificationStatus: user.verificationStatus ?? "pending",
        lastEvent: event
          ? {
              id: toStringId(event._id),
              title: event.title,
              description: event.description,
              status: event.status,
              timestamp: event.timestamp,
            }
          : null,
      };
    });

  const managedUsers = users.map((user) => {
    const userId = toStringId(user._id);
    const wallet = walletByUser.get(userId);
    const summary = summaryByUser.get(userId);
    return {
      id: userId,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      membership: user.membership,
      bonusPoints: user.bonusPoints ?? 0,
      verificationStatus: user.verificationStatus ?? "pending",
      createdAt: user.createdAt,
      isActive: user.isActive,
      wallet: wallet
        ? {
            balance: wallet.balance ?? 0,
            totalDeposited: wallet.totalDeposited ?? 0,
            totalWithdrawn: wallet.totalWithdrawn ?? 0,
            earningRate: wallet.earningRate ?? 0,
          }
        : null,
      summary: summary
        ? {
            totalValue: summary.totalValue ?? 0,
            totalReturn: summary.totalReturn ?? 0,
            dailyChange: summary.dailyChange ?? 0,
            netDeposits: summary.netDeposits ?? 0,
          }
        : null,
    };
  });

  const tokenList = tokens.map((token) => ({
    id: toStringId(token._id) ?? token.id ?? token.symbol,
    symbol: token.symbol,
    name: token.name,
    price: token.currentPrice ?? token.price ?? 0,
    change: token.priceChangePercentage24h ?? token.change ?? 0,
    marketCap: token.marketCap ?? 0,
  }));

  const activityHistory = operations.map((operation) => {
    const user = userIndex.get(toStringId(operation.userId));
    return {
      id: toStringId(operation._id),
      userId: toStringId(operation.userId),
      email: user?.email,
      type: operation.type,
      action: operation.action,
      context: operation.context ?? {},
      occurredAt: operation.occurredAt ?? operation.createdAt,
      actorId: operation.actorId ? toStringId(operation.actorId) : undefined,
    };
  });

  const verificationHistory = activityHistory
    .filter((entry) => entry.type === "verification")
    .map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      email: entry.email ?? "Unknown",
      action: entry.action.replace("documents_", ""),
      timestamp: entry.occurredAt,
      adminEmail: entry.context?.adminEmail,
    }));

  return {
    pendingTransactions: pending,
    verificationQueue,
    users: managedUsers,
    tokens: tokenList,
    verificationHistory,
    activityHistory,
  };
}
