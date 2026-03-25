import { useEffect, useState } from "react";
import { Bell, FileText, Eye, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useDashboardData } from "../hooks/useDashboardData";

export function AdminNotificationsInbox({ onViewDocuments }) {
  const { user, actions } = useDashboardData();
  const adminActions = actions?.admin;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!adminActions) return;
      setLoading(true);
      try {
        const overview = await adminActions.fetchOverview();
        if (!mounted) return;
        const proofs = Array.isArray(overview?.verificationHistory)
          ? overview.verificationHistory
          : [];
        const pending = Array.isArray(overview?.pendingTransactions) ? overview.pendingTransactions : [];

        // Normalize items for the inbox: proofs first, then pending requests
        const normalizedProofs = proofs
          .filter(Boolean)
          .slice(0, 12)
          .map((p) => ({
            id: `proof-${p.id}`,
            kind: "proof",
            title: p.title ?? "Verification artifact",
            subtitle: p.email ?? p.userEmail ?? p.user?.email ?? "",
            timestamp: p.timestamp ?? p.createdAt ?? null,
            meta: p.meta ?? p,
            raw: p,
          }));

        const normalizedPending = pending
          .filter(Boolean)
          .slice(0, 12)
          .map((entry) => ({
            id: `pending-${entry.transaction?.id ?? entry.id}`,
            kind: "pending",
            title: `${entry.transaction?.type ?? "Instruction"} • ${entry.transaction?.symbol ?? ""}`,
            subtitle: entry.user?.email ?? "",
            timestamp: entry.transaction?.requestedAt ?? null,
            meta: { transaction: entry.transaction, user: entry.user },
            raw: entry,
          }));

        setItems([...normalizedProofs, ...normalizedPending]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unable to load inbox items"));
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [adminActions]);

  if (!user || !adminActions) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Notifications inbox</h2>
          <div className="inline-flex items-center gap-2 text-xs text-slate-400">
            <Bell className="size-4" /> {items.length}
          </div>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-full p-2 transition hover:bg-white/10"
        >
          {collapsed ? (
            <ChevronDown className="size-5 text-slate-400" />
          ) : (
            <ChevronUp className="size-5 text-slate-400" />
          )}
        </button>
      </div>
      
      {!collapsed && (
        <div className="mt-4 space-y-3 text-sm text-slate-300">
        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
            Loading inbox…
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            {error.message ?? "Failed to load notifications."}
          </div>
        )}
        {!loading && items.length === 0 && (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
            No recent notifications. Deposit proofs and pending requests will appear here.
          </p>
        )}
        {!loading && items.slice(0, 10).map((it) => (
          <div key={it.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-500/10 p-2">
                {it.kind === 'proof' ? <FileText className="size-4 text-blue-300" /> : <Clock className="size-4 text-slate-300" />}
              </div>
              <div>
                <p className="font-semibold text-white">{it.title}</p>
                <p className="text-xs text-slate-400">{it.subtitle}</p>
                {it.timestamp && (
                  <p className="text-[11px] text-slate-500 mt-1">{new Date(it.timestamp).toLocaleString()}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {it.kind === 'proof' && (
                <button
                  type="button"
                  onClick={() => {
                    // open documents for the user if we have a reference
                    const userId = it.raw?.userId ?? it.raw?.userId ?? it.raw?.user?.id ?? null;
                    if (userId && typeof onViewDocuments === 'function') {
                      onViewDocuments({ id: userId, email: it.subtitle });
                    } else if (it.raw?.userId && typeof onViewDocuments === 'function') {
                      onViewDocuments({ id: it.raw.userId, email: it.subtitle });
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 px-3 py-1 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/10"
                >
                  <Eye className="size-3" /> Preview
                </button>
              )}
              {it.kind === 'pending' && (
                <span className="text-xs text-slate-400">{it.meta?.transaction?.status ?? 'pending'}</span>
              )}
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}

export default AdminNotificationsInbox;
