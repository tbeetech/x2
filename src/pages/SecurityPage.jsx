import { Shield, Lock, Key, GlobeLock, BadgeCheck, RefreshCw } from "lucide-react";

const controls = [
  {
    title: "Tier-1 custody partners",
    detail:
      "Segregated wallets across Fireblocks, Copper, and Ledger Enterprise. Automated policy engines with quorum-based approvals.",
  },
  {
    title: "Continuous attestations",
    detail:
      "Quarterly SOC 2 Type II and ISO 27001 renewals. Real-time proof-of-reserve feeds on major custody clusters.",
  },
  {
    title: "Perimeter & endpoint security",
    detail:
      "Hardware-backed keys, zero-trust network edges, phishing-resistant MFA, and device posture verification for every user session.",
  },
  {
    title: "Smart contract assurance",
    detail:
      "In-house audit desk plus partnerships with Trail of Bits, OpenZeppelin, and Quantstamp for code reviews and runtime monitoring.",
  },
];

export function SecurityPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-20">
      <header className="mb-12 space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Security & governance</p>
        <h1 className="text-3xl font-semibold text-white">
          Enterprise-grade digital asset security, refined over 18 years of institutional operations.
        </h1>
        <p className="text-sm text-slate-400">
          XFA Platform blends the rigor of traditional finance with the agility of modern crypto-native
          infrastructure. Every control is designed for regulators, auditors, and, most importantly, your
          investors.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {controls.map((control) => (
          <div
            key={control.title}
            className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:shadow-blue-500/10"
          >
            <Shield className="size-8 rounded-2xl bg-blue-500/10 p-2 text-blue-300" />
            <h2 className="mt-4 text-base font-semibold text-white">{control.title}</h2>
            <p className="mt-2 text-xs text-slate-400">{control.detail}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <h2 className="text-lg font-semibold text-white">Policy stack</h2>
        <div className="mt-4 grid gap-4 text-sm text-slate-300 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <Lock className="size-6 text-blue-300" />
            <p className="mt-2 text-sm font-semibold text-white">Withdrawal governance</p>
            <p className="text-xs text-slate-400">
              Granular policies by user role, asset, value, venue, and time-of-day. All withdrawals require
              quorum approval through hardware-secured signers.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <GlobeLock className="size-6 text-blue-300" />
            <p className="mt-2 text-sm font-semibold text-white">Network segmentation</p>
            <p className="text-xs text-slate-400">
              Production, custody, and analytics networks separated with just-in-time access. Sensitive
              services exposed only through mutually authenticated service meshes.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <BadgeCheck className="size-6 text-blue-300" />
            <p className="mt-2 text-sm font-semibold text-white">Compliance alignment</p>
            <p className="text-xs text-slate-400">
              Comprehensive KYC/AML screening, travel rule adherence, and jurisdictional mapping across the
              U.S., EU, UK, and APAC regulatory regimes.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-purple-600/20 p-6 text-white shadow-xl backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Security reviews & continuous monitoring</h2>
            <p className="text-xs text-blue-100">
              Request the latest SOC reports, penetration test results, and proof-of-reserve attestations.
              Subscribers receive quarterly risk briefings.
            </p>
          </div>
          <a
            href="mailto:support@x-fa.com"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-semibold text-blue-700 transition hover:bg-slate-100"
          >
            security@trd-sphere.com <Key className="size-4" />
          </a>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <h2 className="text-lg font-semibold text-white">Breach & incident response</h2>
        <div className="mt-4 grid gap-4 text-sm text-slate-300 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <RefreshCw className="size-6 text-blue-300" />
            <p className="mt-2 text-sm font-semibold text-white">Automated containment</p>
            <p className="text-xs text-slate-400">
              Real-time monitoring shuts down affected API keys, wallet policies, and user sessions instantly,
              alerting all signers and stakeholders in parallel.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <Shield className="size-6 text-blue-300" />
            <p className="mt-2 text-sm font-semibold text-white">Transparency by design</p>
            <p className="text-xs text-slate-400">
              Immediate status updates, detailed incident reports within 24 hours, and comprehensive RCAs with
              remediation plans shared with clients and regulators.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
