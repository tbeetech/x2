import { memo, useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpRight,
  ArrowUpToLine,
  DollarSign,
  Send,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { LoaderOverlay } from "../components/LoaderOverlay";
import { useRealTimeUpdates } from "../hooks/useRealTimeUpdates";

import { useDashboardData } from "../hooks/useDashboardData";
import "../services/chartConfig";

// Memoized helper functions
const formatUSD = (value = 0) => {
  const numeric = Number(value);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  return safeValue.toLocaleString("en-US", { style: "currency", currency: "USD" });
};

const formatPercent = (value = 0) => {
  const numeric = Number.isFinite(value) ? value : 0;
  return `${numeric >= 0 ? "+" : ""}${numeric}%`;
};

const statusBadge = (status) => {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "completed") {
    return { label: "Completed", className: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/20" };
  }
  if (normalized === "pending") {
    return { label: "Pending admin approval", className: "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/20" };
  }
  if (normalized === "rejected") {
    return { label: "Rejected", className: "bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm shadow-rose-500/20" };
  }
  return { label: "Unknown", className: "bg-slate-600/20 text-slate-200 border border-slate-600/30" };
};

// Helper Components
const StatCard = memo(function StatCard({ icon: Icon, label, value, change, loading, onSelect, actionLabel }) {
  const isPositive = Number(change) >= 0;
  
  const body = (
    <div className="glass-card relative p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 sm:p-5 group">
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/0 to-purple-500/0 opacity-0 transition-opacity duration-300 group-hover:from-blue-500/5 group-hover:to-purple-500/5 group-hover:opacity-100"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-lg"></div>
            <Icon className="relative size-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-2.5 text-cyan-300 backdrop-blur-xl sm:size-10 sm:p-2 border border-cyan-500/20" />
          </div>
          <span className={`text-base font-bold sm:text-xs ${isPositive ? 'profit-positive' : 'profit-negative'}`}>
            {loading ? "..." : formatPercent(change)}
          </span>
        </div>
        <p className="mt-6 text-sm uppercase tracking-wider text-slate-400 sm:text-xs font-medium">{label}</p>
        <p className="mt-2 text-3xl font-bold text-white sm:text-2xl tracking-tight">
          {loading ? "..." : value}
        </p>
        {onSelect && (
          <span className="mt-3 inline-flex items-center text-sm font-semibold text-cyan-300 sm:text-xs group-hover:text-cyan-200 transition-colors">
            {actionLabel ?? "Open details"} <ArrowUpRight className="ml-1 size-4 sm:size-3" />
          </span>
        )}
      </div>
    </div>
  );

  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className="w-full text-left focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded-3xl">
        {body}
      </button>
    );
  }

  return body;
});

// Main component
export function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  
  const {
    user,
    summary,
    wallet,
    transactions,
    verification,
    loading,
    error,
    refreshData,
  } = useDashboardData();

  // Real-time updates via Socket.IO
  useRealTimeUpdates(
    user?.id,
    useCallback((_balanceData) => {
      // Refresh dashboard data when balance updates
      if (refreshData) {
        refreshData();
      }
    }, [refreshData]),
    useCallback(() => {
      // Refresh dashboard data when notification received
      if (refreshData) {
        refreshData();
      }
    }, [refreshData])
  );

  // Check for processing alert from deposit flow
  useEffect(() => {
    if (location.state?.showProcessingAlert) {
      setShowAlert(true);
      setAlertMessage(location.state.message || "Processing payment...");
      
      // Clear the state to prevent showing alert on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.pathname, navigate]);

  return (
    <div className="min-h-[85vh] px-4 py-6 sm:px-6 sm:py-8">
      <LoaderOverlay show={loading} />

      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-xl font-semibold text-white sm:text-2xl lg:text-3xl truncate">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
              </h1>
              {user?.verificationStatus === "approved" && (
                <ShieldCheck className="size-5 text-emerald-400 sm:size-6 flex-shrink-0" title="Verified Account" />
              )}
            </div>
            <p className="mt-1 text-sm text-slate-400 sm:text-base sm:mt-2">
              Review your holdings, orchestrate liquidity, and monitor approvals in real time.
            </p>
          </div>

          <div className="flex w-full gap-2 sm:w-auto sm:gap-3">
            <button
              type="button"
              onClick={() => navigate("/transactions/new?type=deposit")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-600 sm:flex-initial sm:px-5 sm:text-base"
            >
              <ArrowDownToLine className="size-4 sm:size-5" />
              <span className="hidden sm:inline">Deposit</span>
              <span className="sm:hidden">Deposit</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/transactions/new?type=withdraw")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:flex-initial sm:px-5 sm:text-base"
            >
              <ArrowUpToLine className="size-4 sm:size-5" />
              <span className="hidden sm:inline">Withdraw</span>
              <span className="sm:hidden">Withdraw</span>
            </button>
          </div>
        </header>

        {!loading && error && error.message !== "AUTH_REQUIRED" && (
          <div className="mb-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error.message ?? "Unable to refresh account data."}
          </div>
        )}

        {/* Processing Alert from Deposit Flow */}
        {showAlert && (
          <div className="mb-6 rounded-2xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-blue-400" />
              <span>{alertMessage}</span>
            </div>
            <button
              onClick={() => setShowAlert(false)}
              className="text-blue-400 hover:text-blue-300 transition-colors ml-4"
              aria-label="Close alert"
            >
              ×
            </button>
          </div>
        )}

        {/* Verification moved to profile settings - no banner on dashboard */}

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          <StatCard
            icon={WalletCards}
            label="Wallet Balance"
            value={formatUSD(wallet?.balance)}
            change={0}
            loading={loading}
          />
          <StatCard
            icon={DollarSign}
            label="Portfolio Value"
            value={formatUSD(summary?.totalValue)}
            change={summary?.totalReturn}
            loading={loading}
          />
          <StatCard
            icon={TrendingUp}
            label="Total Return"
            value={formatPercent(summary?.totalReturn)}
            change={summary?.dailyChange}
            loading={loading}
          />
          <StatCard
            icon={Send}
            label="Net Deposits"
            value={formatUSD(summary?.netDeposits)}
            change={0}
            loading={loading}
            onSelect={() => navigate("/transactions")}
            actionLabel="View transactions"
          />
        </div>

        <section className="mt-4 grid gap-4 sm:gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="glass-card p-4 shadow-lg backdrop-blur sm:p-5 lg:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-white sm:text-xl">Recent transactions</h2>
              <span className="text-xs text-cyan-300 sm:text-sm flex items-center gap-2">
                <span className="size-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Live sync
              </span>
            </div>
            <div className="mt-3 divide-y divide-white/5 sm:mt-4 lg:mt-5 overflow-x-auto">
              {transactions.slice(0, 6).map((tx) => {
                const badge = statusBadge(tx.status);
                return (
                  <div key={tx.id} className="flex items-center justify-between py-3 text-sm sm:py-4 sm:text-base min-w-0">
                    <div className="min-w-0 flex-1 pr-3 sm:pr-4">
                      <p className="font-semibold text-white truncate">
                        {tx.type} {tx.symbol}
                      </p>
                      <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                        {new Date(tx.requestedAt ?? tx.date ?? Date.now()).toLocaleString()}
                      </p>
                      <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold sm:px-3 sm:py-1.5 sm:text-sm ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="font-semibold text-white text-sm sm:text-base">
                        {tx.direction === "out" ? "-" : "+"}
                        {formatUSD(tx.total)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                        {tx.amount} @ {formatUSD(tx.price ?? 1)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-4 text-sm text-slate-300 shadow-lg backdrop-blur sm:p-5 lg:p-6 lg:text-base">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400 sm:text-sm">Status centre</p>
            <h3 className="mt-2 text-lg font-bold text-white sm:mt-3 sm:text-xl">Account insights</h3>
            <ul className="mt-3 space-y-3 sm:mt-4 lg:mt-5 sm:space-y-4">
              {(verification.length ? verification : []).slice(0, 3).map((item) => (
                <li key={item.id} className="flex items-start gap-2 group sm:gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-md"></div>
                    <ShieldCheck className="relative mt-0.5 size-5 flex-shrink-0 text-emerald-400 sm:mt-1 sm:size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white group-hover:text-cyan-200 transition-colors text-sm sm:text-base">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400 sm:text-sm">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => navigate("/security")}
              className="mt-4 w-full rounded-xl border-2 border-cyan-400/40 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-4 py-3 text-sm font-bold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:shadow-lg hover:shadow-cyan-500/20 sm:mt-5 sm:px-5 sm:text-base"
            >
              Review security posture
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
