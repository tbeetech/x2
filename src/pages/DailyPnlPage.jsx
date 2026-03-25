import { useMemo, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import { useDashboardData } from "../hooks/useDashboardData";
import "../services/chartConfig";

const TIMEFRAMES = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "All", value: "all" },
];

function formatUSD(value = 0) {
  return `$${Number(value).toLocaleString()}`;
}

export function DailyPnlPage() {
  const { dailyPnl, actions } = useDashboardData();
  const [timeframe, setTimeframe] = useState(14);
  const [formValues, setFormValues] = useState({
    date: new Date().toISOString().split("T")[0],
    realized: "",
    unrealized: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const filtered = useMemo(() => {
    if (timeframe === "all") return dailyPnl;
    return dailyPnl.slice(0, timeframe);
  }, [dailyPnl, timeframe]);

  const chartData = useMemo(() => {
    const labels = filtered
      .slice()
      .reverse()
      .map((entry) => entry.date);

    const realized = filtered
      .slice()
      .reverse()
      .map((entry) => entry.realized);

    const unrealized = filtered
      .slice()
      .reverse()
      .map((entry) => entry.unrealized);

    return {
      labels,
      datasets: [
        {
          label: "Realized P&L",
          data: realized,
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.18)",
        },
        {
          label: "Unrealized P&L",
          data: unrealized,
          borderColor: "#a855f7",
          backgroundColor: "rgba(168, 85, 247, 0.18)",
        },
      ],
    };
  }, [filtered]);

  const contributionChart = useMemo(() => {
    const lastEntries = filtered.slice(0, 10).reverse();
    return {
      labels: lastEntries.map((entry) => entry.date),
      datasets: [
        {
          label: "Total daily P&L",
          data: lastEntries.map((entry) => entry.realized + entry.unrealized),
          backgroundColor: lastEntries.map((entry) =>
            entry.realized + entry.unrealized >= 0 ? "rgba(16, 185, 129, 0.6)" : "rgba(248, 113, 113, 0.6)",
          ),
        },
      ],
    };
  }, [filtered]);

  const totals = useMemo(() => {
    const realized = filtered.reduce((acc, entry) => acc + entry.realized, 0);
    const unrealized = filtered.reduce((acc, entry) => acc + entry.unrealized, 0);
    return { realized, unrealized };
  }, [filtered]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      await actions.recordPnl({
        date: formValues.date,
        realized: Number(formValues.realized || 0),
        unrealized: Number(formValues.unrealized || 0),
        notes: formValues.notes,
      });
      setFeedback({ type: "success", message: "Manual adjustment recorded." });
      setFormValues({
        date: new Date().toISOString().split("T")[0],
        realized: "",
        unrealized: "",
        notes: "",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message ?? "Unable to log entry.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pb-20">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Daily P&L Control Tower</h1>
          <p className="text-sm text-slate-400">
            Monitor realized and unrealized performance, annotate market context, and log adjustments for
            your investment committee.
          </p>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Trend analysis</h2>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                Realized & unrealized evolution
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {TIMEFRAMES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTimeframe(option.value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    timeframe === option.value
                      ? "bg-blue-500 text-white"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 h-72">
            <Line
              data={chartData}
              options={{
                plugins: { legend: { labels: { color: "rgba(226,232,240,0.8)" } } },
                scales: {
                  x: {
                    ticks: { color: "rgba(148,163,184,0.7)" },
                    grid: { color: "rgba(148,163,184,0.1)" },
                  },
                  y: {
                    ticks: { color: "rgba(148,163,184,0.7)" },
                    grid: { color: "rgba(148,163,184,0.1)" },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
          <h2 className="text-lg font-semibold text-white">Summary</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span>Total realized</span>
              <span className="font-semibold text-white">{formatUSD(totals.realized)}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span>Total unrealized</span>
              <span className="font-semibold text-white">{formatUSD(totals.unrealized)}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
              Maintain granular commentary for every trading session so auditors, partners, and LPs have a
              transparent trail of decision making. All entries are export-ready for NAV packages.
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
          <h2 className="text-lg font-semibold text-white">P&L contribution</h2>
          <div className="mt-4 h-64">
            <Bar
              data={contributionChart}
              options={{
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    ticks: { color: "rgba(148,163,184,0.7)" },
                    grid: { color: "rgba(148,163,184,0.1)" },
                  },
                  y: {
                    ticks: { color: "rgba(148,163,184,0.7)" },
                    grid: { color: "rgba(148,163,184,0.1)" },
                  },
                },
              }}
            />
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-3">Date</th>
                  <th className="py-3">Realized</th>
                  <th className="py-3">Unrealized</th>
                  <th className="py-3">Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((entry) => (
                  <tr key={entry.date}>
                    <td className="py-3">{entry.date}</td>
                    <td className="py-3 font-semibold text-emerald-300">
                      {formatUSD(entry.realized)}
                    </td>
                    <td className="py-3 font-semibold text-blue-300">
                      {formatUSD(entry.unrealized)}
                    </td>
                    <td className="py-3 text-xs text-slate-400">{entry.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
          <h2 className="text-lg font-semibold text-white">Log adjustment</h2>
          <p className="text-xs text-slate-400">
            Capture discretionary trades, OTC fills, or hedge adjustments to maintain an institutional
            audit trail.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm text-slate-200">
            <label className="block text-xs uppercase tracking-wide text-slate-400">
              Date
              <input
                required
                type="date"
                value={formValues.date}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, date: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-xs uppercase tracking-wide text-slate-400">
                Realized P&L
                <input
                  type="number"
                  step="0.01"
                  value={formValues.realized}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, realized: event.target.value }))
                  }
                  placeholder="e.g. 1250"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </label>
              <label className="block text-xs uppercase tracking-wide text-slate-400">
                Unrealized P&L
                <input
                  type="number"
                  step="0.01"
                  value={formValues.unrealized}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, unrealized: event.target.value }))
                  }
                  placeholder="e.g. -340"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </label>
            </div>

            <label className="block text-xs uppercase tracking-wide text-slate-400">
              Market context / notes
              <textarea
                rows={3}
                value={formValues.notes}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, notes: event.target.value }))
                }
                placeholder="Captured GLP funding yield, rolled ETH hedge, etc."
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </label>

            {feedback && (
              <div
                className={`rounded-xl border px-3 py-2 text-xs font-medium ${feedback.type === "success" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-rose-500/40 bg-rose-500/10 text-rose-100"}`}
              >
                {feedback.message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-400 hover:to-purple-500 disabled:opacity-60"
            >
              {submitting ? "Recording…" : "Record adjustment"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
