import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  User,
  Calendar,
  Hash,
  FileText,
  Loader2,
} from "lucide-react";
import { useAccountData } from "../context/AccountDataContext";
import { toast } from "react-toastify";

export function AdminInvestmentRequests() {
  const { accountState, adminActions } = useAccountData();
  const [processingId, setProcessingId] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionType, setTransactionType] = useState("deposit"); // "deposit" or "investment"
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  const pendingTransactions = accountState?.pendingTransactions || [];
  const pendingDeposits = pendingTransactions.filter(
    (item) => item.transaction?.type === "deposit" || item.transaction?.type === "Deposit"
  );
  const pendingInvestments = pendingTransactions.filter(
    (item) => item.transaction?.type === "investment" || item.transaction?.type === "Investment"
  );

  useEffect(() => {
    // Refresh data when component mounts
    if (adminActions?.refreshOverview) {
      adminActions.refreshOverview();
    }
  }, [adminActions]);

  const handleConfirmDeposit = async (transaction) => {
    setProcessingId(transaction.id || transaction._id);
    try {
      await adminActions.approveDeposit({
        transactionId: transaction.id || transaction._id,
        note: "Approved by admin",
      });

      toast.success(`Deposit of $${transaction.total?.toFixed(2) || 0} confirmed successfully!`);

      // Refresh the overview to get updated data
      if (adminActions?.refreshOverview) {
        await adminActions.refreshOverview();
      }
    } catch (error) {
      console.error("Error confirming deposit:", error);
      toast.error(error.message || "Failed to confirm deposit");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineDeposit = async (transaction) => {
    setSelectedTransaction(transaction);
    setTransactionType("deposit");
    setShowDeclineModal(true);
  };

  const confirmDecline = async () => {
    if (!selectedTransaction) return;

    setProcessingId(selectedTransaction.id || selectedTransaction._id);
    try {
      if (transactionType === "deposit") {
        await adminActions.rejectDeposit({
          transactionId: selectedTransaction.id || selectedTransaction._id,
          reason: declineReason || "Rejected by admin",
        });
        toast.success("Deposit declined successfully!");
      } else if (transactionType === "investment") {
        await adminActions.rejectInvestment({
          investmentId: selectedTransaction.id || selectedTransaction._id,
          reason: declineReason || "Rejected by admin",
        });
        toast.success("Investment declined successfully!");
      }

      // Refresh the overview to get updated data
      if (adminActions?.refreshOverview) {
        await adminActions.refreshOverview();
      }

      setShowDeclineModal(false);
      setDeclineReason("");
      setSelectedTransaction(null);
    } catch (error) {
      console.error(`Error declining ${transactionType}:`, error);
      toast.error(error.message || `Failed to decline ${transactionType}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmInvestment = async (investment) => {
    setProcessingId(investment.id || investment._id);
    try {
      await adminActions.approveInvestment({
        investmentId: investment.id || investment._id,
        note: "Approved by admin",
      });

      toast.success(`Investment of $${investment.amount?.toFixed(2) || 0} approved successfully!`);

      // Refresh the overview to get updated data
      if (adminActions?.refreshOverview) {
        await adminActions.refreshOverview();
      }
    } catch (error) {
      console.error("Error approving investment:", error);
      toast.error(error.message || "Failed to approve investment");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineInvestment = async (investment) => {
    setSelectedTransaction(investment);
    setTransactionType("investment");
    setShowDeclineModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Investment & Deposit Requests</h2>
          <p className="mt-1 text-sm text-slate-400">
            Review and approve pending transactions from users
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2">
          <Clock className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-semibold text-blue-400">
            {pendingTransactions.length} Pending
          </span>
        </div>
      </div>

      {/* Pending Deposits Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-400" />
          Deposit Requests ({pendingDeposits.length})
        </h3>

        {pendingDeposits.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-slate-600" />
            <p className="mt-4 text-sm text-slate-400">No pending deposit requests</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingDeposits.map((item) => {
              const transaction = item.transaction;
              const user = item.user;
              const isProcessing = processingId === (transaction.id || transaction._id);

              return (
                <div
                  key={transaction.id || transaction._id}
                  className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition-all hover:border-emerald-400/30 hover:bg-white/10"
                >
                  {/* User Info */}
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                      <User className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="truncate text-xs text-slate-400">{user?.email}</p>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="space-y-3 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Amount</span>
                      <span className="text-lg font-bold text-emerald-400">
                        ${transaction.total?.toFixed(2) || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Asset</span>
                      <span className="text-sm font-semibold text-white">
                        {transaction.symbol || "USD"}
                      </span>
                    </div>

                    {transaction.metadata?.walletAddress && (
                      <div className="flex items-start justify-between">
                        <span className="text-xs text-slate-400">Wallet</span>
                        <span className="max-w-[60%] truncate text-xs font-mono text-slate-300">
                          {transaction.metadata.walletAddress}
                        </span>
                      </div>
                    )}

                    {transaction.metadata?.network && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Network</span>
                        <span className="text-sm text-white">{transaction.metadata.network}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Date</span>
                      <span className="text-xs text-slate-300">
                        {formatDate(transaction.requestedAt || transaction.occurredOn)}
                      </span>
                    </div>

                    {transaction.reference && (
                      <div className="flex items-start justify-between">
                        <span className="text-xs text-slate-400">Reference</span>
                        <span className="max-w-[60%] truncate text-xs font-mono text-slate-300">
                          {transaction.reference}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleConfirmDeposit(transaction)}
                      disabled={isProcessing}
                      className="flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Confirm
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeclineDeposit(transaction)}
                      disabled={isProcessing}
                      className="flex items-center justify-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Investments Section */}
      {pendingInvestments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-400" />
            Investment Requests ({pendingInvestments.length})
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingInvestments.map((item) => {
              const investment = item.investment;
              const user = item.user;
              const isProcessing = processingId === (investment?.id || investment?._id);

              return (
                <div
                  key={investment?.id || investment?._id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
                      <User className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="truncate text-xs text-slate-400">{user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <p className="text-xs text-slate-400">Investment Amount</p>
                    <p className="text-2xl font-bold text-purple-400">
                      ${investment?.amount?.toFixed(2) || 0}
                    </p>
                    {investment?.planTitle && (
                      <p className="text-xs text-slate-400">{investment.planTitle}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      {formatDate(investment?.createdAt)}
                    </p>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <button
                      onClick={() => handleConfirmInvestment(investment)}
                      disabled={isProcessing}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-emerald-600 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Confirm
                    </button>
                    <button
                      onClick={() => handleDeclineInvestment(investment)}
                      disabled={isProcessing}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-400 transition-all hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20">
                <AlertCircle className="h-6 w-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Decline {transactionType === "deposit" ? "Deposit" : "Investment"}
                </h3>
                <p className="text-sm text-slate-400">
                  Provide a reason for declining this {transactionType}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300">
                Reason (optional)
              </label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Enter reason for declining..."
                rows={4}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason("");
                  setSelectedTransaction(null);
                }}
                className="flex-1 rounded-full border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={confirmDecline}
                disabled={processingId !== null}
                className="flex-1 rounded-full bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingId ? "Processing..." : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
