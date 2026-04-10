import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Users,
  Coins,
  Trash2,
  Plus,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import { LoaderOverlay } from "../components/LoaderOverlay";
import { useDashboardData } from "../hooks/useDashboardData";
import { AdminContentManager } from "../components/AdminContentManager.jsx";
import AdminNotificationsInbox from "../components/AdminNotificationsInbox.jsx";
import { AdminTreasuryManager } from "../components/AdminTreasuryManager.jsx";
import { apiClient } from "../services/apiClient";
import { useAdminRealTimeUpdates } from "../hooks/useAdminRealTimeUpdates";
import { getSocket } from "../services/socketService";

function formatUSD(value = 0) {
  return `$${Number(value).toLocaleString()}`;
}

function shortenAddress(address = "", lead = 6, tail = 4) {
  if (!address) return "";
  if (address.length <= lead + tail + 3) {
    return address;
  }
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, actions } = useDashboardData();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenForm, setTokenForm] = useState({ symbol: "", name: "", price: "", change: "" });
  const [editingUser, setEditingUser] = useState(null);
  const [userDraft, setUserDraft] = useState({ balance: "", netDeposits: "", bonusPoints: "", membership: "" });
  const [documentsModal, setDocumentsModal] = useState(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  
  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState({
    pendingTransactions: false,
    verificationQueue: false,
    verificationHistory: false,
    approvedVerifications: false,
    clientAccounts: false,
    marketTokens: false,
  });
  
  // Search states
  const [searchQueries, setSearchQueries] = useState({
    verificationQueue: "",
    approvedVerifications: "",
    clientAccounts: "",
  });

  const adminActions = actions.admin;
  
  // Real-time updates handler for admin notifications
  const handleAdminNotification = useCallback((data) => {
    console.log('[AdminDashboard] Received admin notification:', data);
    
    // Refresh overview when new verification or transaction is submitted
    if (data.type === 'new_verification' || data.type === 'new_deposit' || data.type === 'new_withdrawal') {
      // Reload the admin overview to show new items
      if (adminActions?.fetchOverview) {
        adminActions.fetchOverview()
          .then(freshData => setOverview(freshData))
          .catch(err => console.error('Failed to refresh admin overview:', err));
      }
    }
  }, [adminActions]);
  
  // Subscribe to admin real-time updates
  useAdminRealTimeUpdates(
    user?.role === 'admin' ? user?.id : null,
    handleAdminNotification
  );
  
  // Listen for admin transaction processed events to immediately update UI
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    
    const socketInstance = getSocket();
    
    if (!socketInstance) return;
    
    const handleTransactionProcessed = (data) => {
      console.log('[AdminDashboard] Transaction processed:', data);
      
      // Optimistically remove the transaction from pending list
      setOverview(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          pendingTransactions: prev.pendingTransactions.filter(
            tx => tx.transaction?.id !== data.transactionId
          ),
        };
      });
      
      // Refresh full overview in background for accuracy
      if (adminActions?.fetchOverview) {
        adminActions.fetchOverview()
          .then(freshData => setOverview(freshData))
          .catch(err => console.error('Failed to refresh admin overview:', err));
      }
    };
    
    const handleVerificationProcessed = (data) => {
      console.log('[AdminDashboard] Verification processed:', data);
      
      // Optimistically remove/update the user from verification queue
      setOverview(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          verificationQueue: prev.verificationQueue.filter(
            v => v.id !== data.userId
          ),
        };
      });
      
      // Refresh full overview in background for accuracy
      if (adminActions?.fetchOverview) {
        adminActions.fetchOverview()
          .then(freshData => setOverview(freshData))
          .catch(err => console.error('Failed to refresh admin overview:', err));
      }
    };
    
    socketInstance.on('admin_transaction_processed', handleTransactionProcessed);
    socketInstance.on('admin_verification_processed', handleVerificationProcessed);
    
    return () => {
      socketInstance.off('admin_transaction_processed', handleTransactionProcessed);
      socketInstance.off('admin_verification_processed', handleVerificationProcessed);
    };
  }, [user, adminActions]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") {
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!adminActions) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await adminActions.fetchOverview();
        if (mounted) {
          setOverview(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          console.error("Admin overview fetch failed:", err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [adminActions]);

  const pendingTransactions = useMemo(() => overview?.pendingTransactions ?? [], [overview]);
  const verificationQueue = useMemo(() => overview?.verificationQueue ?? [], [overview]);
  const verificationHistoryLog = useMemo(() => overview?.verificationHistory ?? [], [overview]);
  const managedUsers = useMemo(() => overview?.users ?? [], [overview]);
  const tokens = useMemo(() => overview?.tokens ?? [], [overview]);
  
  // Separate approved verifications from pending
  const approvedVerifications = useMemo(() => {
    return managedUsers.filter(u => u.verificationStatus === 'approved' || u.verificationStatus === 'verified');
  }, [managedUsers]);
  
  // Filter functions
  const filteredVerificationQueue = useMemo(() => {
    const query = searchQueries.verificationQueue.toLowerCase();
    if (!query) return verificationQueue;
    return verificationQueue.filter(v => 
      v.name?.toLowerCase().includes(query) || 
      v.email?.toLowerCase().includes(query)
    );
  }, [verificationQueue, searchQueries.verificationQueue]);
  
  const filteredApprovedVerifications = useMemo(() => {
    const query = searchQueries.approvedVerifications.toLowerCase();
    if (!query) return approvedVerifications;
    return approvedVerifications.filter(v => 
      v.name?.toLowerCase().includes(query) || 
      v.email?.toLowerCase().includes(query)
    );
  }, [approvedVerifications, searchQueries.approvedVerifications]);
  
  const filteredClientAccounts = useMemo(() => {
    const query = searchQueries.clientAccounts.toLowerCase();
    if (!query) return managedUsers;
    return managedUsers.filter(u => 
      u.name?.toLowerCase().includes(query) || 
      u.email?.toLowerCase().includes(query)
    );
  }, [managedUsers, searchQueries.clientAccounts]);
  
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const updateSearch = (section, value) => {
    setSearchQueries(prev => ({ ...prev, [section]: value }));
  };

  async function handleTransactionDecision(record, decision) {
    console.log('[AdminDashboard] handleTransactionDecision called:', { record, decision });
    if (!adminActions) {
      console.error('[AdminDashboard] No adminActions available!');
      return;
    }
    try {
      setLoading(true);
      const transaction = record?.transaction ?? record;
      const transactionId = transaction?.id;
      console.log('[AdminDashboard] Transaction:', { transaction, transactionId });
      if (!transactionId) {
        throw new Error("Missing transaction id.");
      }
      const txType = (transaction?.type ?? "").trim().toLowerCase();
      const isTrade = txType === "trade";
      const isDeposit = txType === "deposit";
      console.log('[AdminDashboard] Transaction type check:', { txType, isTrade, isDeposit });
      let payload;
      if (decision === "approve") {
        console.log('[AdminDashboard] Approving transaction...');
        if (isTrade) {
          console.log('[AdminDashboard] Calling approveTrade with:', { transactionId });
          payload = await adminActions.approveTrade({ transactionId });
        } else if (isDeposit) {
          console.log('[AdminDashboard] Calling approveDeposit');
          payload = await adminActions.approveDeposit({ transactionId });
        } else {
          console.log('[AdminDashboard] Calling generic approveTransaction');
          payload = await adminActions.approveTransaction({ transactionId });
        }
      } else {
        if (isTrade) {
          payload = await adminActions.rejectTrade({ transactionId, reason: "Rejected by admin" });
        } else if (isDeposit) {
          payload = await adminActions.rejectDeposit({ transactionId, reason: "Rejected by admin" });
        } else {
          payload = await adminActions.rejectTransaction({ transactionId, reason: "Rejected by admin" });
        }
      }
      console.log('[AdminDashboard] API response payload:', payload);
      if (payload?.pendingTransactions) {
        setOverview(payload);
      } else {
        const refreshed = await adminActions.fetchOverview();
        setOverview(refreshed);
      }
    } catch (err) {
      console.error('[AdminDashboard] Error in handleTransactionDecision:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerification(userId) {
    if (!adminActions) return;
    try {
      setLoading(true);
      const next = await adminActions.approveVerification(userId);
      setOverview(next);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleManualVerificationStatusChange(userId, newStatus) {
    if (!adminActions) return;
    try {
      setLoading(true);
      const updates = {
        verificationStatus: newStatus,
      };
      const next = await adminActions.updateUser({ userId, updates });
      setOverview(next);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  function startEditing(userRecord) {
    setEditingUser(userRecord);
    setUserDraft({
      balance: userRecord.wallet?.balance ?? "",
      netDeposits: userRecord.summary?.netDeposits ?? "",
      bonusPoints: userRecord.bonusPoints ?? "",
      membership: userRecord.membership ?? "",
      verificationStatus: userRecord.verificationStatus ?? "pending",
    });
  }

  async function handleSaveUser() {
    if (!adminActions || !editingUser) return;
    try {
      setLoading(true);
      const updates = {
        bonusPoints: Number(userDraft.bonusPoints ?? editingUser.bonusPoints ?? 0),
        membership: userDraft.membership || editingUser.membership,
        verificationStatus: userDraft.verificationStatus || editingUser.verificationStatus || "pending",
        summary: {
          ...editingUser.summary,
          netDeposits: Number(userDraft.netDeposits ?? editingUser.summary?.netDeposits ?? 0),
        },
        wallet: {
          ...editingUser.wallet,
          balance: Number(userDraft.balance ?? editingUser.wallet?.balance ?? 0),
        },
      };
      const next = await adminActions.updateUser({ userId: editingUser.id, updates });
      setOverview(next);
      setEditingUser(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(userId) {
    if (!adminActions) return;
    if (!window.confirm("Delete this user and all associated data?")) {
      return;
    }
    try {
      setLoading(true);
      const next = await adminActions.deleteUser(userId);
      setOverview(next);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateToken(event) {
    event.preventDefault();
    if (!adminActions) return;
    try {
      setLoading(true);
      const payload = {
        symbol: tokenForm.symbol,
        name: tokenForm.name,
        price: Number(tokenForm.price ?? 0),
        change: Number(tokenForm.change ?? 0),
      };
      const next = await adminActions.createToken(payload);
      setTokenForm({ symbol: "", name: "", price: "", change: "" });
      setOverview(next);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewDocuments(record) {
    if (!adminActions?.fetchVerificationDocuments) return;
    setDocumentsModal({ user: record, documents: [], events: [] });
    setDocumentsLoading(true);
    try {
      const payload = await adminActions.fetchVerificationDocuments(record.id);
      setDocumentsModal({
        user: record,
        documents: payload?.documents ?? [],
        events: payload?.events ?? [],
      });
    } catch (err) {
      setError(err);
    } finally {
      setDocumentsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl mobile-safe px-4 sm:px-6 pb-20">
      <LoaderOverlay show={loading} label="Updating…" />

      <div className="mb-8 md:mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white truncate">Admin control center</h1>
          <p className="text-sm text-slate-400 mt-1">
            Approve treasury instructions, manage verifications, and curate XFA market data in real time.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/10 px-3 sm:px-4 py-1 text-xs sm:text-sm font-semibold text-blue-200 shrink-0">
          <ShieldCheck className="size-4" />
          <span className="truncate max-w-[200px]">{overview?.admin?.email ?? user?.email}</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <div className="break-words">{error.message ?? "An unexpected error occurred."}</div>
        </div>
      )}

  <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-white min-w-0 truncate">Pending client instructions</h2>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10 shrink-0"
              onClick={async () => {
                if (!adminActions) return;
                setLoading(true);
                try {
                  const next = await adminActions.fetchOverview();
                  setOverview(next);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <RefreshCw className="size-3" /> Refresh
            </button>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-200">
            <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 shrink-0">
                {pendingTransactions.length} pending {pendingTransactions.length === 1 ? 'request' : 'requests'}
              </span>
              <span className="text-xs text-slate-400 shrink-0">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            {pendingTransactions.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
                No pending instructions. Approvals will surface here as clients submit requests.
              </p>
            ) : (
              pendingTransactions.map((entry) => {
                const tx = entry.transaction;
                const userName =
                  entry.user?.firstName && entry.user?.lastName
                    ? `${entry.user.firstName} ${entry.user.lastName}`
                    : entry.user?.email ?? "Client";
                const fiatValue = formatUSD(tx.total ?? tx.amount ?? 0);
                const cryptoAmount =
                  tx.metadata?.cryptoAmount && Number(tx.metadata.cryptoAmount) > 0
                    ? Number(tx.metadata.cryptoAmount).toFixed(6)
                    : null;
                const walletLabel = tx.walletLabel ?? tx.metadata?.walletLabel ?? "Treasury wallet";
                const walletAddress = tx.walletAddress ?? tx.metadata?.walletAddress ?? "";
                const network = tx.network ?? tx.metadata?.network ?? "On-chain";
                const submittedAt = tx.requestedAt
                  ? new Date(tx.requestedAt).toLocaleString()
                  : "Pending timestamp";
                const reference = tx.metadata?.transactionHash ?? tx.reference ?? null;

                return (
                  <div
                    key={entry.transaction.id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1 text-xs text-slate-400 min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white break-words">
                          {userName} wants to confirm payment #{entry.transaction.id.slice(-6)}
                        </p>
                        <p className="break-words">
                          {fiatValue} {cryptoAmount ? `(${cryptoAmount} ${tx.symbol})` : ""}
                          {" - "}
                          {tx.symbol} via {network}
                        </p>
                        <p className="break-words">
                          Destination: {walletLabel}
                          {walletAddress ? ` (${shortenAddress(walletAddress)})` : ""}
                        </p>
                        <p className="break-words">
                          Submitted {submittedAt} - {entry.user?.email ?? "unknown email"}
                          {reference ? ` - Ref: ${reference}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-row gap-2 sm:flex-col lg:flex-row shrink-0">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-1 text-xs font-semibold text-white shadow hover:from-emerald-400 hover:to-green-500 min-h-[32px]"
                        onClick={() => handleTransactionDecision(entry, "approve")}
                        >
                          <CheckCircle2 className="size-3 shrink-0" /> 
                          <span className="hidden sm:inline">Confirm received</span>
                          <span className="sm:hidden">Confirm</span>
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/10 min-h-[32px]"
                        onClick={() => handleTransactionDecision(entry, "reject")}
                        >
                          <XCircle className="size-3 shrink-0" />
                          <span className="hidden sm:inline">Decline</span>
                          <span className="sm:hidden">Decline</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="space-y-6">
          <AdminNotificationsInbox onViewDocuments={(user) => handleViewDocuments(user)} />

          {/* Verification Queue - Collapsible */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white truncate">Verification queue</h2>
              <button
                onClick={() => toggleSection('verificationQueue')}
                className="rounded-full p-2 transition hover:bg-white/10 shrink-0"
              >
                {collapsedSections.verificationQueue ? (
                  <ChevronDown className="size-5 text-slate-400" />
                ) : (
                  <ChevronUp className="size-5 text-slate-400" />
                )}
              </button>
            </div>
            
            {!collapsedSections.verificationQueue && (
              <>
                {/* Search Box */}
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQueries.verificationQueue}
                    onChange={(e) => updateSearch('verificationQueue', e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  {filteredVerificationQueue.length === 0 ? (
                    <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
                      {searchQueries.verificationQueue ? 'No matching pending verifications.' : 'All clients are fully verified.'}
                    </p>
                  ) : (
                    filteredVerificationQueue.map((record) => (
                      <div key={record.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="font-semibold text-white break-words">{record.name}</p>
                        <p className="text-xs text-slate-400 break-words">{record.email}</p>
                        {record.lastEvent && (
                          <p className="mt-1 text-[11px] text-slate-500 break-words">
                            {record.lastEvent.title} · {new Date(record.lastEvent.timestamp).toLocaleString()}
                          </p>
                        )}
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          <select
                            value={record.verificationStatus || 'pending'}
                            onChange={(e) => handleManualVerificationStatusChange(record.id, e.target.value)}
                            className="rounded-lg border border-white/10 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 min-h-[40px]"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="verified">Verified</option>
                          </select>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/60 px-4 py-2 text-xs font-semibold text-white shadow backdrop-blur-sm transition hover:bg-purple-900/70 hover:border-purple-400/50 min-h-[40px]"
                            onClick={() => handleViewDocuments(record)}
                          >
                            View documents
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:from-blue-400 hover:to-purple-500 min-h-[40px]"
                            onClick={() => handleVerification(record.id)}
                          >
                            <ShieldCheck className="size-3 shrink-0" /> Approve verification
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Approved Verifications - New Section */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-lg font-semibold text-white truncate">Approved ID Members</h2>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-200 shrink-0">
                  {approvedVerifications.length}
                </span>
              </div>
              <button
                onClick={() => toggleSection('approvedVerifications')}
                className="rounded-full p-2 transition hover:bg-white/10 shrink-0"
              >
                {collapsedSections.approvedVerifications ? (
                  <ChevronDown className="size-5 text-slate-400" />
                ) : (
                  <ChevronUp className="size-5 text-slate-400" />
                )}
              </button>
            </div>
            
            {!collapsedSections.approvedVerifications && (
              <>
                {/* Search Box */}
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search approved members..."
                    value={searchQueries.approvedVerifications}
                    onChange={(e) => updateSearch('approvedVerifications', e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  {filteredApprovedVerifications.length === 0 ? (
                    <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
                      {searchQueries.approvedVerifications ? 'No matching approved members.' : 'No approved verifications yet.'}
                    </p>
                  ) : (
                    filteredApprovedVerifications.map((record) => (
                      <div key={record.id} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-white break-words">{record.name}</p>
                              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                            </div>
                            <p className="text-xs text-slate-400 break-words">{record.email}</p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              Verified • Membership: {record.membership || 'Member'}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row shrink-0">
                            <select
                              value={record.verificationStatus || 'pending'}
                              onChange={(e) => handleManualVerificationStatusChange(record.id, e.target.value)}
                              className="rounded-lg border border-white/10 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 min-h-[32px]"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                              <option value="verified">Verified</option>
                            </select>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-white/10 min-h-[32px] shrink-0"
                              onClick={() => startEditing(record)}
                            >
                              View profile
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-lg backdrop-blur">
          <h2 className="text-lg font-semibold text-white">Verification history</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {verificationHistoryLog.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
                No recent verification activity recorded.
              </p>
            ) : (
              verificationHistoryLog.slice(0, 8).map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-semibold text-white break-words">{entry.email}</p>
                    <p className="text-xs text-slate-400 break-words">
                      {entry.action === "approved" ? "Approved" : "Submitted"} •{" "}
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                    {entry.adminEmail && (
                      <p className="text-[11px] text-slate-500 break-words">Handled by {entry.adminEmail}</p>
                    )}
                  </div>
                  <Clock className="size-4 text-blue-300 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 sm:mt-12 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Client Accounts - Collapsible */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white truncate">Client accounts</h2>
            <button
              onClick={() => toggleSection('clientAccounts')}
              className="rounded-full p-2 transition hover:bg-white/10 shrink-0"
            >
              {collapsedSections.clientAccounts ? (
                <ChevronDown className="size-5 text-slate-400" />
              ) : (
                <ChevronUp className="size-5 text-slate-400" />
              )}
            </button>
          </div>
          
          {!collapsedSections.clientAccounts && (
            <>
              {/* Search Box */}
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQueries.clientAccounts}
                  onChange={(e) => updateSearch('clientAccounts', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              
              <div className="mt-4 space-y-4 text-sm text-slate-200">
                {filteredClientAccounts.length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
                    {searchQueries.clientAccounts ? 'No matching client accounts.' : 'No client accounts found.'}
                  </p>
                ) : (
                  filteredClientAccounts.map((record) => (
              <div key={record.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 sm:px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white break-words">{record.name}</p>
                    <p className="text-xs text-slate-400 break-words">{record.email}</p>
                    <p className="mt-1 text-xs text-slate-500">Bonus points: {record.bonusPoints}</p>
                  </div>
                  <div className="flex flex-row gap-2 sm:flex-col lg:flex-row shrink-0">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 px-3 py-1 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/10 min-h-[32px]"
                      onClick={() => startEditing(record)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/10 min-h-[32px]"
                      onClick={() => handleDeleteUser(record.id)}
                    >
                      <Trash2 className="size-3 shrink-0" /> 
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 text-xs text-slate-400 sm:grid-cols-2">
                  <div>
                    <p className="uppercase tracking-wide">Wallet balance</p>
                    <p className="text-white break-words">{formatUSD(record.wallet?.balance ?? 0)}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide">Net deposits</p>
                    <p className="text-white break-words">{formatUSD(record.summary?.netDeposits ?? 0)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
          </div>
        </>
      )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-lg backdrop-blur">
          <h2 className="text-lg font-semibold text-white">Market tokens</h2>
          <div className="table-container">
            <ul className="mt-4 space-y-3 text-sm text-slate-200 sm:min-w-[300px]">
              {tokens.map((token) => (
                <li key={token.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 gap-3">
                  <span className="min-w-0 flex-1">
                    <strong className="text-white break-words">{token.symbol}</strong> • 
                    <span className="break-words"> {token.name}</span>
                  </span>
                  <span className="text-xs text-slate-400 shrink-0 text-right">
                    <span className="block">{formatUSD(token.price)}</span>
                    <span className="block">({token.change}% 24h)</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <form className="mt-6 space-y-3" onSubmit={handleCreateToken}>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Add token</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                required
                value={tokenForm.symbol}
                onChange={(event) => setTokenForm((prev) => ({ ...prev, symbol: event.target.value }))}
                placeholder="Symbol (e.g. ARB)"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <input
                required
                value={tokenForm.name}
                onChange={(event) => setTokenForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Name"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <input
                required
                type="number"
                step="0.01"
                value={tokenForm.price}
                onChange={(event) => setTokenForm((prev) => ({ ...prev, price: event.target.value }))}
                placeholder="Price"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <input
                required
                type="number"
                step="0.01"
                value={tokenForm.change}
                onChange={(event) => setTokenForm((prev) => ({ ...prev, change: event.target.value }))}
                placeholder="24h change %"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:from-blue-400 hover:to-purple-500 min-h-[40px]"
            >
              <Plus className="size-4 shrink-0" /> Add token
            </button>
          </form>
        </div>
      </section>

      <section className="mt-8 sm:mt-12">
        <AdminContentManager />
      </section>

      <section className="mt-8 sm:mt-12">
        <AdminTreasuryManager />
      </section>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur p-4">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/10 p-4 sm:p-6 text-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-white truncate">Edit {editingUser.name}</h3>
              <button
                type="button"
                className="rounded-full border border-white/10 p-2 text-white transition hover:bg-white/10 shrink-0"
                onClick={() => setEditingUser(null)}
              >
                <XCircle className="size-4" />
              </button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-wide text-slate-500">
                Wallet balance
                <input
                  type="number"
                  step="0.01"
                  value={userDraft.balance}
                  onChange={(event) => setUserDraft((prev) => ({ ...prev, balance: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </label>
              <label className="text-xs uppercase tracking-wide text-slate-500">
                Net deposits
                <input
                  type="number"
                  step="0.01"
                  value={userDraft.netDeposits}
                  onChange={(event) => setUserDraft((prev) => ({ ...prev, netDeposits: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </label>
              <label className="text-xs uppercase tracking-wide text-slate-500">
                Bonus points
                <input
                  type="number"
                  value={userDraft.bonusPoints}
                  onChange={(event) => setUserDraft((prev) => ({ ...prev, bonusPoints: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </label>
              <label className="text-xs uppercase tracking-wide text-slate-500">
                Membership tier
                <input
                  value={userDraft.membership}
                  onChange={(event) => setUserDraft((prev) => ({ ...prev, membership: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </label>
              <label className="text-xs uppercase tracking-wide text-slate-500">
                Verification Status
                <select
                  value={userDraft.verificationStatus}
                  onChange={(event) => setUserDraft((prev) => ({ ...prev, verificationStatus: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-800/80 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end text-xs">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition hover:bg-white/10 min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUser}
                className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-white shadow transition hover:from-blue-400 hover:to-purple-500 min-h-[40px]"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
      {documentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur p-4">
          <div className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-white/10 p-4 sm:p-6 text-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-white truncate">Verification documents</h2>
                <p className="text-xs text-slate-400 break-words">{documentsModal.user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setDocumentsModal(null)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:border-blue-400/40 hover:text-blue-200 shrink-0"
              >
                Close
              </button>
            </div>
            <LoaderOverlay show={documentsLoading} label="Loading verification artifacts..." />
            <div className="mt-4 space-y-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Uploaded files</p>
                {documentsModal.documents.length === 0 ? (
                  <p className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
                    No documents available yet.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm">
                    {documentsModal.documents.map((doc) => {
                      const handleDownload = async () => {
                        try {
                          const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
                          if (!token) {
                            alert('Authentication required. Please log in again.');
                            return;
                          }
                          const base = (apiClient.config.apiBaseUrl ?? "/api").replace(/\/$/, "");
                          const downloadUrl = `${base}/admin/verification/documents/${doc.id}/download`;
                          
                          const response = await fetch(downloadUrl, {
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          });
                          
                          if (!response.ok) {
                            throw new Error('Download failed');
                          }
                          
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = doc.filename;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } catch (error) {
                          console.error('Download error:', error);
                          alert('Failed to download document. Please try again.');
                        }
                      };
                      
                      return (
                        <li
                          key={doc.id}
                          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-white break-words">{doc.filename}</p>
                            <p className="text-xs text-slate-500 break-words">
                              {(doc.size / (1024 * 1024)).toFixed(2)} MB · Uploaded{" "}
                              {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : ""}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleDownload}
                            className="rounded-full border border-blue-400/40 px-3 py-1 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/10 min-h-[32px] inline-flex items-center justify-center shrink-0"
                          >
                            Download
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Event history</p>
                {documentsModal.events.length === 0 ? (
                  <p className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
                    No verification events recorded.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2 text-xs text-slate-300">
                    {documentsModal.events.map((event) => (
                      <li key={event.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
                        <p className="font-semibold text-white break-words">{event.title}</p>
                        <p className="text-[11px] text-slate-500 break-words">{new Date(event.timestamp).toLocaleString()}</p>
                        <p className="mt-1 text-[11px] text-slate-400 break-words">{event.description}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
