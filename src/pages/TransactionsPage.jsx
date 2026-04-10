import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpToLine, Clock, Filter, Receipt, X, Printer } from "lucide-react";
import { LoaderOverlay } from "../components/LoaderOverlay";
import { useTransactionsData } from "../hooks/useTransactionsData";

function formatUSD(value = 0) {
  return `$${Number(value).toLocaleString()}`;
}

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function buildStatus(status) {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "completed") {
    return { label: "Completed", className: "bg-emerald-500/10 text-emerald-300" };
  }
  if (normalized === "pending") {
    return { label: "Pending approval", className: "bg-amber-500/10 text-amber-300" };
  }
  if (normalized === "rejected") {
    return { label: "Rejected", className: "bg-rose-500/10 text-rose-300" };
  }
  return { label: "Unknown", className: "bg-slate-700/30 text-slate-200" };
}

export function TransactionsPage() {
  const { transactions, loading } = useTransactionsData();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    const list = [...transactions].sort(
      (a, b) => new Date(b.requestedAt ?? b.date ?? 0).getTime() - new Date(a.requestedAt ?? a.date ?? 0).getTime(),
    );
    if (filter === "all") return list;
    return list.filter((tx) => (tx.status ?? "").toLowerCase() === filter);
  }, [transactions, filter]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <LoaderOverlay show={loading} label="Fetching transactions..." />

      <div className="mb-8 flex flex-col gap-4 lg:mb-10 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Transactions</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor every deposit, withdrawal, and transfer. Each entry includes a printable receipt for audit trails.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {/* <button className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10" type="button">
            <ArrowDownToLine className="size-4" />
            Export CSV
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-blue-400 hover:to-purple-500" type="button">
            <ArrowUpToLine className="size-4" />
            Record manual entry
          </button> */}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur sm:p-6">
        <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-slate-400">
            <Clock className="size-4" />
            30 day activity
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="size-4" />
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 sm:w-auto"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending approval</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="table-container overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-3 px-2 sm:px-0">Reference</th>
                <th className="py-3 px-2">Type</th>
                <th className="py-3 px-2">Asset</th>
                <th className="py-3 px-2">Amount</th>
                <th className="py-3 px-2">Total</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((tx) => {
                const badge = buildStatus(tx.status);
                return (
                  <tr
                    key={tx.id}
                    className="cursor-pointer transition hover:bg-white/5"
                    onClick={() => setSelected(tx)}
                  >
                    <td className="py-3 px-2 font-mono text-xs text-slate-500 sm:px-0">{tx.id}</td>
                    <td className="py-3 px-2 font-semibold text-white">{tx.type}</td>
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium text-white">{tx.asset}</p>
                        <p className="text-xs text-slate-400">{tx.symbol}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2">{tx.amount}</td>
                    <td className="py-3 px-2 font-semibold text-white">{formatUSD(tx.total)}</td>
                    <td className="py-3 px-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold sm:px-3 ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-xs text-slate-400">
                      {formatDateTime(tx.requestedAt ?? tx.date)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-white/10 p-4 text-slate-200 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Transaction details</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-white/10 p-2 text-white transition hover:bg-white/10"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 sm:px-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Receipt className="size-4 text-blue-300" />
                XFA Platform transaction receipt
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                {formatDateTime(selected.completedAt ?? selected.requestedAt ?? selected.date)} - Ref: {selected.id}
              </p>
              <div className="mt-4 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
                <Detail label="Type" value={selected.type} />
                <Detail label="Status" value={buildStatus(selected.status).label} />
                <Detail label="Asset" value={selected.asset} />
                <Detail label="Amount" value={selected.amount} />
                <Detail label="Total value" value={formatUSD(selected.total)} />
                <Detail label="Method / destination" value={selected.method ?? selected.destination ?? "-"} />
                {selected.walletLabel && <Detail label="Wallet" value={selected.walletLabel} />}
                {selected.walletAddress && (
                  <Detail label="Wallet address" value={selected.walletAddress} full />
                )}
                {selected.network && <Detail label="Network" value={selected.network} />}
                {selected.metadata?.cryptoAmount && (
                  <Detail
                    label="Crypto amount"
                    value={`${Number(selected.metadata.cryptoAmount).toFixed(6)} ${selected.symbol ?? ""}`.trim()}
                  />
                )}
                {selected.metadata?.transactionHash && (
                  <Detail label="On-chain hash" value={selected.metadata.transactionHash} full />
                )}
                {selected.reference && <Detail label="Reference" value={selected.reference} full />}
                {selected.adminNote && <Detail label="Admin note" value={selected.adminNote} full />}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-600/50 bg-slate-800/60 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700/70 hover:text-white"
                onClick={() => window.print()}
              >
                <Printer className="size-4" />
                Print receipt
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:from-blue-400 hover:to-purple-500"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, full = false }) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="font-semibold text-white break-words">{value}</p>
    </div>
  );
}







