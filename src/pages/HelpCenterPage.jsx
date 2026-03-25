import { useState } from "react";
import { ArrowRight, Headset, LifeBuoy, Mail, Search, Send } from "lucide-react";

const faqItems = [
  {
    question: "How do I accelerate a large fiat on-ramp into my XFA Platform wallet?",
    answer:
      "Submit a deposit instruction from the dashboard and include your banking reference. Our treasury desk monitors inbound wires 24/7 and allocates funds with institutional SLAs. For wires above $5M, notify support@x-fa.com so we can pre-stage custody routes.",
  },
  {
    question: "What is the process for enabling multi-signature withdrawals?",
    answer:
      "Navigate to Security â†’ Policies to configure signers and thresholds. XFA Platform integrates with Fireblocks, Ledger Enterprise and custom policy engines. Once activated, all withdrawals will require quorum approval through encrypted in-app signing.",
  },
  {
    question: "Can XFA Platform connect to our internal risk and accounting stack?",
    answer:
      "Yes. Use our REST and WebSocket APIs for trade, balance, and P&L data. We also support direct Snowflake replication and pre-built adapters for Addepar, Black Mountain, and Clearwater Analytics. Contact support@x-fa.com to schedule a technical onboarding.",
  },
];

const contactChannels = [
  {
    icon: Mail,
    title: "Priority email",
    description: "Average first response under 12 minutes with full escalation path.",
    detail: "Email support@x-fa.com from your whitelisted domain.",
  },
  {
    icon: LifeBuoy,
    title: "Incident bridge",
    description: "Real-time status, rollback plans, and RCA archives.",
    detail: "Subscribe to alerts via /status or support@x-fa.com.",
  },
];

export function HelpCenterPage() {
  const [search, setSearch] = useState("");
  const filteredFaq = faqItems.filter((item) =>
    item.question.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-5xl px-6 pb-20">
      <header className="mb-12 space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Help center</p>
        <h1 className="text-3xl font-semibold text-white">
          18 years of institutional crypto experience â€“ at your fingertips.
        </h1>
        <p className="text-sm text-slate-400">
          Browse playbooks, contact our concierge desk, or launch a secure workspace with our technical
          specialists.
        </p>
        <div className="relative mx-auto mt-6 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search for cold storage, DeFi policies, reportingâ€¦"
            className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {contactChannels.map((channel) => (
          <div
            key={channel.title}
            className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:shadow-blue-500/10"
          >
            <channel.icon className="size-8 rounded-2xl bg-blue-500/10 p-2 text-blue-300" />
            <h2 className="mt-4 text-base font-semibold text-white">{channel.title}</h2>
            <p className="mt-2 text-xs text-slate-400">{channel.description}</p>
            <p className="mt-3 text-xs text-slate-200">{channel.detail}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Expert playbooks & resources</h2>
          <a
            href="/knowledge-base"
            className="inline-flex items-center gap-2 rounded-full border border-blue-400/60 px-4 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/10"
          >
            Browse knowledge base <ArrowRight className="size-4" />
          </a>
        </div>
        <ul className="mt-4 grid gap-4 text-sm text-slate-300 md:grid-cols-2">
          <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white">Operational readiness review</p>
            <p className="text-xs text-slate-400">
              A 30-point checklist covering custody architecture, exchange venue connectivity, trade
              surveillance, and compliance mapping for digital asset allocators.
            </p>
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white">Counterparty risk library</p>
            <p className="text-xs text-slate-400">
              Access XFA Platformâ€™s continuously updated counterparty dossiers, proof-of-reserve audits,
              and liquidity monitoring signals.
            </p>
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white">DAO & DeFi participation guides</p>
            <p className="text-xs text-slate-400">
              Understand KYC controls, smart contract insurance, and automated policy enforcement for DAO
              governance and liquidity provisioning.
            </p>
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white">Tax & reporting templates</p>
            <p className="text-xs text-slate-400">
              Country-specific tax packs, GAAP/IFRS reconciliations, and NAV-ready exports for your
              administrators and auditors.
            </p>
          </li>
        </ul>
      </section>

      <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <h2 className="text-lg font-semibold text-white">Frequently asked questions</h2>
        <div className="mt-4 space-y-4">
          {filteredFaq.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
            >
              <summary className="cursor-pointer list-none font-semibold text-white">
                {item.question}
              </summary>
              <p className="mt-2 text-xs text-slate-400">{item.answer}</p>
            </details>
          ))}
          {filteredFaq.length === 0 && (
            <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
              Nothing matched your search. Reach out to support@x-fa.com and our specialists will respond
              within minutes.
            </p>
          )}
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-blue-400/20 bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-purple-600/20 p-6 text-white shadow-xl backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Schedule a war-room session</h2>
            <p className="text-xs text-blue-100">
              Launch a secure Zoom or Teams bridge with our trading, risk, and engineering leads for
              high-touch onboarding or incident response.
            </p>
          </div>
          <a
            href="mailto:support@x-fa.com"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-semibold text-blue-700 transition hover:bg-slate-100"
          >
            support@x-fa.com <Send className="size-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
