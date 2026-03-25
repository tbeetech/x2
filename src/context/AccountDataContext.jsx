/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchDashboardSummary,
  depositFunds,
  uploadTransactionScreenshots,
  createInvestment,
  markNotificationRead as apiMarkNotificationRead,
  archiveNotification as apiArchiveNotification,
  deleteNotification as apiDeleteNotification,
  clearReadNotifications as apiClearReadNotifications,
  clearArchivedNotifications as apiClearArchivedNotifications,
  withdrawFunds,
  transferFunds,
  executeTrade,
  logPnlEntry,
  fetchAdminOverview,
  approveTransaction,
  rejectTransaction,
  updateUserAccount,
  deleteUser,
  approveVerification,
  createToken,
  fetchVerificationDocuments,
  submitVerificationDocuments,
  approveTradeTransaction,
  rejectTradeTransaction,
  approveDepositTransaction,
  rejectDepositTransaction,
  approveInvestmentRequest,
  rejectInvestmentRequest,
  MOCK_STORAGE_KEY,
} from "../services/apiClient";
import { useAuth } from "./AuthContext.jsx";
import { logger } from "../services/logger";
import { initializeSocket, disconnectSocket, subscribeToEvents, getSocket } from "../services/socketService";

const AccountDataContext = createContext(null);
const ALERT_WINDOW_MS = 30 * 60 * 1000;
const MAX_NOTIFICATION_ITEMS = 40;
const DAY_MS = 24 * 60 * 60 * 1000;

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number.isFinite(Number(value)) ? Number(value) : 0,
  );

function synthesizeAlertNotifications({
  notifications,
  user,
  summary,
  wallet,
  positions,
  pendingTransactions,
}) {
  const snapshot = Array.isArray(notifications) ? [...notifications] : [];
  const nowIso = new Date().toISOString();
  const ensureKind = (kind, enabled, builder) => {
    const existingIndex = snapshot.findIndex((note) => note?.meta?.kind === kind);
    if (!enabled) {
      if (existingIndex !== -1) {
        snapshot.splice(existingIndex, 1);
      }
      return;
    }
    const existing = existingIndex !== -1 ? snapshot[existingIndex] : null;
    const isFresh =
      existing && Date.now() - new Date(existing.createdAt ?? 0).getTime() <= ALERT_WINDOW_MS;
    if (isFresh) {
      return;
    }
    if (existingIndex !== -1) {
      snapshot.splice(existingIndex, 1);
    }
    snapshot.unshift(builder());
  };
  const topPosition = Array.isArray(positions) && positions.length ? positions[0] : null;
  ensureKind(
    "price_alert",
    Boolean(user?.preferences?.alerts?.price && topPosition),
    () => ({
      id: `price-${Date.now()}`,
      userId: user?.id,
      type: "info",
      title: "Price alert",
      body: `${(topPosition?.symbol ?? "Core assets").toString().toUpperCase()} left your comfort band. Check the market tab for live quotes.`,
      read: false,
      createdAt: nowIso,
      meta: { kind: "price_alert" },
    }),
  );
  const hasPortfolioAlert = Boolean(user?.preferences?.alerts?.portfolio);
  ensureKind(
    "portfolio_digest",
    hasPortfolioAlert,
    () => ({
      id: `digest-${Date.now()}`,
      userId: user?.id,
      type: "info",
      title: "Portfolio summary",
      body: `Balance ${formatCurrency(summary?.totalValue)} · Net deposits ${formatCurrency(summary?.netDeposits ?? wallet?.totalDeposited)} · Pending items ${pendingTransactions?.length ?? 0}.`,
      read: false,
      createdAt: nowIso,
      meta: { kind: "portfolio_digest" },
    }),
  );
  return snapshot.slice(0, MAX_NOTIFICATION_ITEMS);
}

function buildInitialState() {
  return {
    user: null,
    summary: {
      totalBalance: 0,
      totalInvested: 0,
      totalProfit: 0,
      profitPercentage: 0,
    },
    wallet: {
      balance: 0,
      pendingDeposits: 0,
      pendingWithdrawals: 0,
    },
    positions: [],
    transactions: [],
    verification: [],
    dailyPnl: [],
    pendingTransactions: [],
    portfolioHistory: [{ date: new Date(), value: 0 }], // Add default portfolio history
    loading: false,
    error: null,
    isAuthenticated: false,
    hasResolvedAuth: false,
  };
}

function mergeAccountState(prev, next) {
  const mergedUser = next.user ?? prev.user;
  const mergedSummary = next.summary ?? prev.summary;
  const mergedWallet = next.wallet ?? prev.wallet;
  const mergedPositions = next.positions ?? prev.positions;
  const mergedTransactions = next.transactions ?? prev.transactions;
  const mergedVerification = next.verification ?? prev.verification;
  const mergedDailyPnl = next.dailyPnl ?? prev.dailyPnl;
  const mergedPending = next.pendingTransactions ?? prev.pendingTransactions ?? [];
  const mergedPortfolioHistory = next.portfolioHistory ?? prev.portfolioHistory;
  const mergedNotifications = synthesizeAlertNotifications({
    notifications: next.notifications ?? prev.notifications ?? [],
    user: mergedUser,
    summary: mergedSummary,
    wallet: mergedWallet,
    positions: mergedPositions,
    pendingTransactions: mergedPending,
  });
  return {
    ...prev,
    user: mergedUser,
    summary: mergedSummary,
    wallet: mergedWallet,
    positions: mergedPositions,
    transactions: mergedTransactions,
    verification: mergedVerification,
    dailyPnl: mergedDailyPnl,
    pendingTransactions: mergedPending,
    portfolioHistory: mergedPortfolioHistory, // Include portfolio history
    notifications: mergedNotifications,
    loading: false,
    error: null,
    isAuthenticated: true,
    hasResolvedAuth: true,
  };
}

function createLoggedOutState() {
  const base = buildInitialState();
  return {
    ...base,
    hasResolvedAuth: true,
  };
}

function isAuthError(error) {
  if (!error) {
    return false;
  }
  const code = error.code ?? error.message;
  return code === "AUTH_REQUIRED" || error.status === 401 || error.status === 403;
}

export function AccountDataProvider({ children }) {
  const [state, setState] = useState(buildInitialState);
  const { user: authUser } = useAuth();

  useEffect(() => {
    if (!state.isAuthenticated) {
      return undefined;
    }
    
    // Initialize Socket.IO for real-time updates
    const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
    if (token) {
      initializeSocket(token);
      
      // Join user-specific room for targeted updates
      const userId = state.user?.id;
      if (userId) {
        setTimeout(() => {
          const socket = getSocket();
          if (socket) {
            socket.emit('join', userId);
            logger.info('Joined user room for real-time updates', { userId });
          }
        }, 500);
      }
      
      // Subscribe to real-time events
      const unsubscribe = subscribeToEvents({
        onBalanceUpdate: (data) => {
          logger.info('Balance update received', data);
          setState((prev) => ({
            ...prev,
            wallet: {
              ...prev.wallet,
              balance: data.balance !== undefined ? data.balance : prev.wallet?.balance,
              totalDeposited: data.totalDeposited !== undefined ? data.totalDeposited : prev.wallet?.totalDeposited,
              totalWithdrawn: data.totalWithdrawn !== undefined ? data.totalWithdrawn : prev.wallet?.totalWithdrawn,
              earningRate: data.earningRate !== undefined ? data.earningRate : prev.wallet?.earningRate,
            },
          }));
        },
        
        onPortfolioUpdate: (data) => {
          logger.info('Portfolio update received', data);
          setState((prev) => ({
            ...prev,
            summary: data.summary ? { ...prev.summary, ...data.summary } : prev.summary,
            wallet: data.wallet ? { ...prev.wallet, ...data.wallet } : prev.wallet,
            positions: data.positions || prev.positions,
          }));
        },
        
        onNotification: (notification) => {
          logger.info('New notification received', notification);
          setState((prev) => ({
            ...prev,
            notifications: [notification, ...(prev.notifications || [])].slice(0, MAX_NOTIFICATION_ITEMS),
          }));
        },
        
        onNewNotification: (notification) => {
          logger.info('New notification (alt) received', notification);
          setState((prev) => ({
            ...prev,
            notifications: [notification, ...(prev.notifications || [])].slice(0, MAX_NOTIFICATION_ITEMS),
          }));
        },
        
        onTransactionUpdate: (data) => {
          logger.info('Transaction update received', data);
          // Immediately update the transaction in state if available
          if (data.transaction) {
            setState((prev) => {
              const updatedTransactions = prev.transactions.map(tx =>
                tx.id === data.transaction.id ? { ...tx, ...data.transaction } : tx
              );
              return {
                ...prev,
                transactions: updatedTransactions,
                wallet: data.wallet || prev.wallet,
                summary: data.summary || prev.summary,
              };
            });
          }
          // Refresh dashboard to get complete latest data
          fetchDashboardSummary().then((dashboard) => {
            setState((prev) =>
              mergeAccountState(prev, {
                transactions: dashboard.transactions,
                pendingTransactions: dashboard.pendingTransactions,
                wallet: dashboard.wallet,
                summary: dashboard.summary,
                positions: dashboard.positions,
              }),
            );
          }).catch((error) => {
            logger.error('Failed to refresh after transaction update', error);
          });
        },
        
        onTransactionStatusChange: (data) => {
          logger.info('Transaction status change received', data);
          if (data.transactionId && data.status) {
            setState((prev) => {
              const updatedTransactions = prev.transactions.map(tx =>
                tx.id === data.transactionId ? { ...tx, status: data.status } : tx
              );
              return { ...prev, transactions: updatedTransactions };
            });
          }
          // Refresh for complete data
          fetchDashboardSummary().then((dashboard) => {
            setState((prev) => mergeAccountState(prev, dashboard));
          }).catch((error) => {
            logger.error('Failed to refresh after status change', error);
          });
        },
        
        onVerificationUpdate: (data) => {
          logger.info('Verification update received', data);
          // Refresh verification timeline
          fetchDashboardSummary().then((dashboard) => {
            setState((prev) =>
              mergeAccountState(prev, {
                verification: dashboard.verification,
                user: dashboard.user || prev.user,
              }),
            );
          }).catch((error) => {
            logger.error('Failed to refresh after verification update', error);
          });
        },
        
        onPositionUpdate: (data) => {
          logger.info('Position update received', data);
          if (data.position) {
            setState((prev) => {
              const updatedPositions = prev.positions.map(pos =>
                pos.id === data.position.id || pos.symbol === data.position.symbol
                  ? { ...pos, ...data.position }
                  : pos
              );
              return { ...prev, positions: updatedPositions };
            });
          } else if (data.positions) {
            setState((prev) => ({ ...prev, positions: data.positions }));
          }
        },
        
        onWalletUpdate: (data) => {
          logger.info('Wallet update received', data);
          setState((prev) => ({
            ...prev,
            wallet: data.wallet ? { ...prev.wallet, ...data.wallet } : prev.wallet,
            summary: data.summary ? { ...prev.summary, ...data.summary } : prev.summary,
          }));
        },
        
        onInvestmentUpdate: (data) => {
          logger.info('Investment update received', data);
          // Refresh complete dashboard for investment changes
          fetchDashboardSummary().then((dashboard) => {
            setState((prev) => mergeAccountState(prev, dashboard));
          }).catch((error) => {
            logger.error('Failed to refresh after investment update', error);
          });
        },
        
        onAccountUpdate: (data) => {
          logger.info('Account update received', data);
          if (data.user) {
            setState((prev) => ({
              ...prev,
              user: { ...prev.user, ...data.user },
            }));
          }
        },
      });
      
      // Polling fallback: refresh data every 30 seconds as backup
      const pollingInterval = setInterval(() => {
        const socket = getSocket();
        if (!socket?.connected) {
          logger.info('Socket disconnected, using polling fallback');
          fetchDashboardSummary().then((dashboard) => {
            setState((prev) => mergeAccountState(prev, dashboard));
          }).catch((error) => {
            logger.error('Polling fallback failed', error);
          });
        }
      }, 30000); // 30 seconds
      
      // Also poll on visibility change (when user switches back to tab)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          logger.info('Tab became visible, refreshing data');
          fetchDashboardSummary().then((dashboard) => {
            setState((prev) => mergeAccountState(prev, dashboard));
          }).catch((error) => {
            logger.error('Visibility refresh failed', error);
          });
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        unsubscribe();
        clearInterval(pollingInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        disconnectSocket();
      };
    }
    
    return undefined;
  }, [state.isAuthenticated, state.user?.id]);

  useEffect(() => {
    if (!state.isAuthenticated) {
      return undefined;
    }
    
    // Auto-refresh dashboard data every 30 seconds for real-time sync
    const refreshInterval = setInterval(async () => {
      try {
        const dashboard = await fetchDashboardSummary();
        setState((prev) =>
          mergeAccountState(prev, {
            user: dashboard.user,
            summary: dashboard.summary,
            wallet: dashboard.wallet,
            positions: dashboard.positions,
            transactions: dashboard.transactions,
            verification: dashboard.verification,
            dailyPnl: dashboard.dailyPnl,
            pendingTransactions: dashboard.pendingTransactions,
            notifications: dashboard.notifications,
            portfolioHistory: dashboard.portfolioHistory,
          }),
        );
      } catch (error) {
        logger.warn("Auto-refresh failed", error);
      }
    }, 30 * 1000); // Refresh every 30 seconds

    // Simulated live profit accrual interval (every 10 minutes)
    const profitInterval = setInterval(() => {
      setState((prev) => {
        if (!prev.isAuthenticated) {
          return prev;
        }
        const nextWalletBalance = (prev.wallet?.balance ?? 0) + 0.5;
        const nextWallet = {
          ...prev.wallet,
          balance: Number(nextWalletBalance.toFixed(2)),
        };
        const nextPositions = Array.isArray(prev.positions)
          ? prev.positions.map((position) => {
              const jitter = 0.995 + Math.random() * 0.01;
              const currentValue = Number(((position.currentValue ?? 0) * jitter).toFixed(2));
              const costBasis = position.costBasis ?? 0;
              const pnl = Number((currentValue - costBasis).toFixed(2));
              const pnlPercent = costBasis > 0 ? Number(((pnl / costBasis) * 100).toFixed(2)) : position.pnlPercent;
              return {
                ...position,
                currentValue,
                pnl,
                pnlPercent,
              };
            })
          : prev.positions;
        const totalPositionsValue = Array.isArray(nextPositions)
          ? nextPositions.reduce((sum, position) => sum + (position.currentValue ?? 0), 0)
          : 0;
        const nextSummary = {
          ...prev.summary,
          totalValue: Number((totalPositionsValue + nextWallet.balance).toFixed(2)),
        };
        const profitNote = {
          id: `profit-update-${Date.now()}`,
          userId: prev.user?.id,
          type: "info",
          title: "Live profit accrual",
          body: "Your earnings have been updated based on current market performance and asset valuations.",
          read: false,
          meta: { kind: "profit_accrual" },
          createdAt: new Date().toISOString(),
        };
        const nextNotifications = synthesizeAlertNotifications({
          notifications: [profitNote, ...(prev.notifications ?? [])],
          user: prev.user,
          summary: nextSummary,
          wallet: nextWallet,
          positions: nextPositions,
          pendingTransactions: prev.pendingTransactions,
        });
        return {
          ...prev,
          wallet: nextWallet,
          positions: nextPositions,
          summary: nextSummary,
          notifications: nextNotifications,
        };
      });
    }, 10 * 60 * 1000);
    
    return () => {
      clearInterval(refreshInterval);
      clearInterval(profitInterval);
    };
  }, [state.isAuthenticated]);

  useEffect(() => {
    let active = true;

    if (!authUser) {
      setState(createLoggedOutState());
      return () => {
        active = false;
      };
    }

    async function bootstrap() {
      setState((prev) => ({
        ...prev,
        user: authUser,
        loading: true,
        error: null,
        isAuthenticated: true,
        hasResolvedAuth: false,
      }));

      try {
        const dashboard = await fetchDashboardSummary();
        if (!active) return;
        setState((prev) =>
          mergeAccountState(prev, {
            user: dashboard.user ? { ...dashboard.user, ...authUser } : authUser,
            summary: dashboard.summary,
            wallet: dashboard.wallet,
            positions: dashboard.positions,
            transactions: dashboard.transactions,
            verification: dashboard.verification,
            dailyPnl: dashboard.dailyPnl,
            pendingTransactions: dashboard.pendingTransactions,
            portfolioHistory: dashboard.portfolioHistory,
            notifications: dashboard.notifications,
          }),
        );
      } catch (error) {
        if (!active) return;
        if (isAuthError(error)) {
          setState(createLoggedOutState());
          return;
        }
        setState((prev) => ({
          ...prev,
          user: authUser,
          loading: false,
          error,
          isAuthenticated: true,
          hasResolvedAuth: true,
        }));
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, [authUser]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const handleStorage = (event) => {
      if (event.key !== MOCK_STORAGE_KEY || !event.newValue) {
        return;
      }
      let parsed;
      try {
        parsed = JSON.parse(event.newValue);
      } catch (parseError) {
        logger.warn("Failed to parse updated Invisphere state from storage", parseError);
        return;
      }
      setState((prev) => {
        const userId = prev.user?.id;
        if (!userId) {
          return prev;
        }
        const nextAccount = parsed?.accounts?.[userId];
        if (!nextAccount) {
          return prev;
        }
        const nextUserRecord = Array.isArray(parsed?.users)
          ? parsed.users.find((candidate) => candidate.id === userId)
          : null;
        const pendingTransactions =
          Array.isArray(nextAccount.transactions)
            ? nextAccount.transactions.filter(
                (tx) => (tx.status ?? "").toLowerCase() === "pending",
              )
            : [];
        return mergeAccountState(prev, {
          user: nextUserRecord ? { ...prev.user, ...nextUserRecord } : prev.user,
          summary: nextAccount.summary,
          wallet: nextAccount.wallet,
          positions: nextAccount.positions,
          transactions: nextAccount.transactions,
          verification: nextAccount.verification,
          dailyPnl: nextAccount.dailyPnl,
          pendingTransactions,
          notifications: parsed?.notifications?.filter((n) => n.userId === nextUserRecord?.id) ?? prev.notifications,
        });
      });
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const actions = useMemo(() => {
    async function refresh() {
      const dashboard = await fetchDashboardSummary();
      setState((prev) =>
        mergeAccountState(prev, {
          user: dashboard.user,
          summary: dashboard.summary,
          wallet: dashboard.wallet,
          positions: dashboard.positions,
          transactions: dashboard.transactions,
          verification: dashboard.verification,
          dailyPnl: dashboard.dailyPnl,
          pendingTransactions: dashboard.pendingTransactions,
          notifications: dashboard.notifications,
        }),
      );
      return dashboard;
    }

    return {
      async submitVerificationDocuments(payload) {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
          const dashboard = await submitVerificationDocuments(payload);
          setState((prev) =>
            mergeAccountState(prev, {
              summary: dashboard.summary,
              wallet: dashboard.wallet,
              positions: dashboard.positions,
              transactions: dashboard.transactions,
              verification: dashboard.verification,
              dailyPnl: dashboard.dailyPnl,
              pendingTransactions: dashboard.pendingTransactions,
                notifications: dashboard.notifications,
            }),
          );
          return dashboard;
        } catch (error) {
          setState((prev) => ({ ...prev, loading: false, error, hasResolvedAuth: true }));
          throw error;
        }
      },
      async uploadTransactionScreenshot(transactionId, { files = [], notes = "" } = {}) {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
          const response = await uploadTransactionScreenshots(transactionId, { files, notes });
          const dashboard = response?.dashboard ?? response;
          if (dashboard && dashboard.summary) {
            setState((prev) =>
              mergeAccountState(prev, {
                user: dashboard.user ?? prev.user,
                summary: dashboard.summary,
                wallet: dashboard.wallet,
                positions: dashboard.positions,
                transactions: dashboard.transactions,
                verification: dashboard.verification,
                dailyPnl: dashboard.dailyPnl,
                pendingTransactions: dashboard.pendingTransactions,
                notifications: dashboard.notifications,
              }),
            );
          } else {
            await refresh();
          }
          return response;
        } catch (error) {
          setState((prev) => ({ ...prev, loading: false, error, hasResolvedAuth: true }));
          throw error;
        }
      },
      async deposit(payload) {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
          const result = await depositFunds(payload);
          // server may return { transaction, dashboard }
          const dashboard = result?.dashboard ?? result;
          const transaction = result?.transaction ?? null;
          if (dashboard && dashboard.summary && dashboard.wallet) {
            setState((prev) =>
              mergeAccountState(prev, {
                user: dashboard.user ?? prev.user,
                summary: dashboard.summary,
                wallet: dashboard.wallet,
                positions: dashboard.positions,
                transactions: dashboard.transactions,
                verification: dashboard.verification,
                dailyPnl: dashboard.dailyPnl,
                pendingTransactions: dashboard.pendingTransactions,
                notifications: dashboard.notifications,
              }),
            );
            return { dashboard, transaction };
          }
          const refreshed = await refresh();
          return { dashboard: refreshed, transaction };
        } catch (error) {
          setState((prev) => ({ ...prev, loading: false, error, hasResolvedAuth: true }));
          throw error;
        }
      },
      async createInvestment(payload) {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
          const result = await createInvestment(payload);
          if (result && result.summary && result.wallet) {
            setState((prev) =>
              mergeAccountState(prev, {
                summary: result.summary,
                wallet: result.wallet,
                positions: result.positions,
                transactions: result.transactions,
                verification: result.verification,
                dailyPnl: result.dailyPnl,
                pendingTransactions: result.pendingTransactions,
                  notifications: result.notifications,
              }),
            );
            return result;
          }
          const dashboard = await refresh();
          return dashboard;
        } catch (error) {
          setState((prev) => ({ ...prev, loading: false, error, hasResolvedAuth: true }));
          throw error;
        }
      },
      async withdraw(payload) {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
          const dashboard = await withdrawFunds(payload);
          setState((prev) =>
            mergeAccountState(prev, {
              summary: dashboard.summary,
              wallet: dashboard.wallet,
              positions: dashboard.positions,
              transactions: dashboard.transactions,
              verification: dashboard.verification,
              dailyPnl: dashboard.dailyPnl,
              pendingTransactions: dashboard.pendingTransactions,
                notifications: dashboard.notifications,
            }),
          );
          return dashboard;
        } catch (error) {
          setState((prev) => ({ ...prev, loading: false, error, hasResolvedAuth: true }));
          throw error;
        }
      },
      async transfer(payload) {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
          const dashboard = await transferFunds(payload);
          setState((prev) =>
            mergeAccountState(prev, {
              summary: dashboard.summary,
              wallet: dashboard.wallet,
              positions: dashboard.positions,
              transactions: dashboard.transactions,
              verification: dashboard.verification,
              dailyPnl: dashboard.dailyPnl,
              pendingTransactions: dashboard.pendingTransactions,
                notifications: dashboard.notifications,
            }),
          );
          return dashboard;
        } catch (error) {
          setState((prev) => ({ ...prev, loading: false, error, hasResolvedAuth: true }));
          throw error;
        }
      },
      async markNotificationRead(notificationId) {
        try {
          await apiMarkNotificationRead(notificationId);
          // Immediately delete the notification after marking as read
          await apiDeleteNotification(notificationId);
          // Remove from local state immediately
          setState((prev) => ({
            ...prev,
            notifications: (prev.notifications ?? []).filter((n) => n.id !== notificationId),
          }));
          return { success: true };
        } catch (error) {
          setState((prev) => ({ ...prev, error }));
          throw error;
        }
      },
      async archiveNotification(notificationId) {
        try {
          await apiArchiveNotification(notificationId);
          // Update local state to mark as archived
          setState((prev) => ({
            ...prev,
            notifications: (prev.notifications ?? []).map((n) => 
              n.id === notificationId ? { ...n, archived: true, read: true } : n
            ),
          }));
          return { success: true };
        } catch (error) {
          setState((prev) => ({ ...prev, error }));
          throw error;
        }
      },
      async markAllNotificationsRead() {
        try {
          const unread = (state.notifications ?? []).filter((n) => !n.read).map((n) => n.id);
          for (const id of unread) {
            try {
              await apiMarkNotificationRead(id);
            } catch (err) {
              // ignore individual failures
              void err;
            }
          }
          // Clear all read notifications from database
          await apiClearReadNotifications();
          // Remove all notifications from local state
          setState((prev) => ({
            ...prev,
            notifications: [],
          }));
          return true;
        } catch (error) {
          setState((prev) => ({ ...prev, error }));
          throw error;
        }
      },
      async clearArchivedNotifications({ olderThanDays } = {}) {
        try {
          await apiClearArchivedNotifications({ olderThanDays });
          setState((prev) => {
            const cutoffMs =
              Number.isFinite(olderThanDays) && olderThanDays > 0
                ? Date.now() - olderThanDays * DAY_MS
                : null;
            const nextNotifications = (prev.notifications ?? []).filter((n) => {
              if (!n.archived) return true;
              if (!cutoffMs) {
                return false;
              }
              const createdAt = new Date(n.createdAt ?? 0).getTime();
              if (Number.isNaN(createdAt)) {
                return false;
              }
              return createdAt > cutoffMs;
            });
            return {
              ...prev,
              notifications: nextNotifications,
            };
          });
          return true;
        } catch (error) {
          setState((prev) => ({ ...prev, error }));
          throw error;
        }
      },
      async trade(order) {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
          const result = await executeTrade(order);
          if (result?.summary && result?.wallet) {
            setState((prev) =>
              mergeAccountState(prev, {
                summary: result.summary,
                wallet: result.wallet,
                positions: result.positions,
                transactions: result.transactions,
                verification: result.verification,
                dailyPnl: result.dailyPnl,
                pendingTransactions: result.pendingTransactions,
              }),
            );
            return { status: "executed", dashboard: result };
          }
          const pendingId = `trade-${Date.now()}`;
          const notional = Number(order.price ?? 0) * Number(order.quantity ?? 0);
          setState((prev) => {
            const pendingRecord = {
              id: pendingId,
              type: order.side === "sell" ? "Sell" : "Buy",
              asset: order.name ?? order.symbol,
              symbol: order.symbol,
              total: Number.isFinite(notional) ? Number(notional.toFixed(2)) : 0,
              amount: Number(order.quantity ?? 0),
              status: "pending",
              requestedAt: new Date().toISOString(),
            };
            const nextPending = [pendingRecord, ...(prev.pendingTransactions ?? [])];
            const notification = {
              id: `${pendingId}-note`,
              userId: prev.user?.id,
              type: "pending",
              title:
                order.side === "sell" ? "Asset sale processing" : "Asset purchase processing",
              body: "Communicating with shareholders to initiate asset attribution.",
              meta: { kind: "trade_request", transactionId: pendingId, symbol: order.symbol, side: order.side },
              read: false,
              createdAt: new Date().toISOString(),
            };
            const notifications = synthesizeAlertNotifications({
              notifications: [notification, ...(prev.notifications ?? [])],
              user: prev.user,
              summary: prev.summary,
              wallet: prev.wallet,
              positions: prev.positions,
              pendingTransactions: nextPending,
            });
            return {
              ...prev,
              loading: false,
              error: null,
              pendingTransactions: nextPending,
              notifications,
            };
          });
          return {
            status: "pending",
            message: result?.message ?? "Order submitted for admin approval.",
          };
        } catch (error) {
          setState((prev) => ({ ...prev, loading: false, error, hasResolvedAuth: true }));
          throw error;
        }
      },
      async recordPnl(entry) {
        try {
          const entries = await logPnlEntry(entry);
          setState((prev) => ({ ...prev, dailyPnl: entries, loading: false, error: null }));
          return entries;
        } catch (error) {
          setState((prev) => ({ ...prev, loading: false, error, hasResolvedAuth: true }));
          throw error;
        }
      },
      refresh,
      admin:
        state.user?.role === "admin"
          ? {
              async fetchOverview() {
                const overview = await fetchAdminOverview();
                return overview;
              },
              async approveTransaction(payload) {
                const overview = await approveTransaction(payload);
                return overview;
              },
              async rejectTransaction(payload) {
                const overview = await rejectTransaction(payload);
                return overview;
              },
              async approveTrade(payload) {
                return approveTradeTransaction(payload);
              },
              async rejectTrade(payload) {
                return rejectTradeTransaction(payload);
              },
              async approveDeposit(payload) {
                return approveDepositTransaction(payload);
              },
              async rejectDeposit(payload) {
                return rejectDepositTransaction(payload);
              },
              async approveInvestment(payload) {
                return approveInvestmentRequest(payload);
              },
              async rejectInvestment(payload) {
                return rejectInvestmentRequest(payload);
              },
              async updateUser(payload) {
                const overview = await updateUserAccount(payload.userId, payload.updates ?? {});
                return overview;
              },
              async deleteUser(userId) {
                const overview = await deleteUser(userId);
                return overview;
              },
              async approveVerification(userId) {
                const overview = await approveVerification(userId);
                return overview;
              },
              async createToken(payload) {
                const overview = await createToken(payload);
                return overview;
              },
              async fetchVerificationDocuments(userId) {
                return fetchVerificationDocuments(userId);
              },
            }
          : null,
    };
  }, [state.user?.role, state.notifications]);

  const value = useMemo(() => {
    return {
      user: state.user,
      summary: state.summary,
      wallet: state.wallet,
      positions: state.positions,
      transactions: state.transactions,
      notifications: state.notifications,
      verification: state.verification,
  dailyPnl: state.dailyPnl,
  pendingTransactions: state.pendingTransactions,
  loading: state.loading,
  error: state.error,
  isAuthenticated: state.isAuthenticated,
  hasResolvedAuth: state.hasResolvedAuth,
  actions,
  };
  }, [state, actions]);

  return <AccountDataContext.Provider value={value}>{children}</AccountDataContext.Provider>;
}

export function useAccountData() {
  const context = useContext(AccountDataContext);
  if (!context) {
    throw new Error("useAccountData must be used within an AccountDataProvider.");
  }
  return context;
}
