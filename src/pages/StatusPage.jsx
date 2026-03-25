import { useMemo } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock, Server, ShieldCheck } from "lucide-react";

const services = [
  { name: "Trading API", status: "operational", latency: "118 ms", uptime: "99.99%" },
  { name: "Portfolio analytics", status: "operational", latency: "230 ms", uptime: "99.97%" },
  { name: "Custody orchestration", status: "operational", latency: "162 ms", uptime: "100%" },
  { name: "Fiat on/off ramps", status: "degraded", latency: "412 ms", uptime: "99.12%" },
  { name: "DeFi policy engine", status: "operational", latency: "201 ms", uptime: "99.89%" },
];

const incidents = [
  {
    title: "Scheduled Fireblocks policy upgrade",
    severity: "maintenance",
    window: "Oct 15, 2025 â€” 02:00 to 04:00 UTC",
    detail:
      "During the maintenance window custodial transfers may require additional approval steps. No downtime expected.",
  },
  {
    title: "US banking partner settlement delays",
    severity: "minor",
    window: "Oct 10, 2025 â€” Ongoing",
    detail:
      "ACH settlement to regional U.S. banks can take up to T+1. Wire and stablecoin rails are unaffected.",
  },
];

const severityConfig = {
  operational: { icon: CheckCircle2, tone: "text-emerald-300", border: "border-emerald-500/30" },
  degraded: { icon: AlertTriangle, tone: "text-amber-300", border: "border-amber-500/30" },
  maintenance: { icon: Clock, tone: "text-blue-200", border: "border-blue-500/30" },
  minor: { icon: AlertTriangle, tone: "text-amber-300", border: "border-amber-500/30" },
};

export function StatusPage() {
  const summary = useMemo(() => {
    const total = services.length;
    const degraded = services.filter((service) => service.status !== "operational").length;
    return { total, degraded };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 pb-20">
      <header className="mb-12 space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Platform status</p>
        <h1 className="text-3xl font-semibold text-white">Transparent uptime for mission-critical desks.</h1>
        <p className="text-sm text-slate-400">
          XFA Platform has operated continuously for 18 years. View live service telemetry, maintenance
          windows, and historical RCA reports.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300 shadow-lg backdrop-blur">
          <ShieldCheck className="size-8 rounded-2xl bg-blue-500/10 p-2 text-blue-300" />
          <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">Overall stability</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {summary.degraded === 0 ? "100% operational" : "Degraded service detected"}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Real-time monitoring across 47 regions. Pager escalation within 90 seconds.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300 shadow-lg backdrop-blur">
          <Server className="size-8 rounded-2xl bg-blue-500/10 p-2 text-blue-300" />
          <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">Active services</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {summary.total - summary.degraded}/{summary.total} running
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Degraded services automatically reroute through backup clusters when available.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300 shadow-lg backdrop-blur">
          <Activity className="size-8 rounded-2xl bg-blue-500/10 p-2 text-blue-300" />
          <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">Subscribed to updates?</p>
          <p className="mt-1 text-lg font-semibold text-white">Join the Ops bulletin</p>
          <a
            href="mailto:status@x-fa.com"
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-blue-400/60 px-4 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/10"
          >
            status@x-fa.com
          </a>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <h2 className="text-lg font-semibold text-white">Service telemetry</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {services.map((service) => {
            const config = severityConfig[service.status] ?? severityConfig.operational;
            return (
              <div
                key={service.name}
                className={`flex flex-col gap-2 rounded-2xl border ${config.border} bg-white/5 px-4 py-4 text-sm text-slate-300`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{service.name}</p>
                  <config.icon className={`size-5 ${config.tone}`} />
                </div>
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400">
                  <span>Latency: {service.latency}</span>
                  <span>90d uptime: {service.uptime}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {service.status === "operational"
                    ? "Running on redundant clusters across NY4, LD4, and TY3."
                    : "Failover procedures in effect. Monitoring closely."}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <h2 className="text-lg font-semibold text-white">Current notices</h2>
        <div className="mt-4 space-y-4">
          {incidents.map((incident) => {
            const config = severityConfig[incident.severity] ?? severityConfig.operational;
            return (
              <div
                key={incident.title}
                className={`rounded-2xl border ${config.border} bg-white/5 px-4 py-4 text-sm text-slate-200`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{incident.title}</p>
                  <config.icon className={`size-4 ${config.tone}`} />
                </div>
                <p className="text-xs text-slate-400">{incident.window}</p>
                <p className="mt-2 text-xs text-slate-300">{incident.detail}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
