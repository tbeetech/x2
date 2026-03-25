import { Calendar, MessageCircle, Mic, Users } from "lucide-react";

const programs = [
  {
    icon: Mic,
    title: "Institutional alpha briefings",
    description:
      "Monthly roundtables featuring XFA Platform strategists, DeFi founders, and macro leaders. Designed for CIOs and risk committees.",
  },
  {
    icon: Users,
    title: "Allocator guild",
    description:
      "A private forum for pensions, endowments, and hedge funds to exchange structures, policy templates, and counterparty intel.",
  },
  {
    icon: MessageCircle,
    title: "Community labs",
    description:
      "Hands-on workshops covering custody innovations, smart contract tooling, and advanced analytics workflows.",
  },
];

const upcoming = [
  {
    title: "Q4 digital asset outlook",
    date: "Oct 24, 2025 â€” 15:00 UTC",
    speakers: "XFA Platform Macro Desk + guest fund CIOs",
  },
  {
    title: "DeFi risk playbook, 2026 edition",
    date: "Nov 7, 2025 â€” 17:00 UTC",
    speakers: "Lead engineers from two top protocols + XFA Platform risk",
  },
  {
    title: "Operationalizing on-chain treasuries",
    date: "Nov 21, 2025 â€” 14:00 UTC",
    speakers: "Family office clients & XFA Platform treasury architects",
  },
];

export function CommunityPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-20">
      <header className="mb-12 space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Community</p>
        <h1 className="text-3xl font-semibold text-white">Where institutional allocators grow together.</h1>
        <p className="text-sm text-slate-400">
          XFA Platform has cultivated a global community of allocators, technologists, and regulators sharing
          intelligence for nearly two decades.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {programs.map((program) => (
          <div
            key={program.title}
            className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:shadow-blue-500/10"
          >
            <program.icon className="size-8 rounded-2xl bg-blue-500/10 p-2 text-blue-300" />
            <h2 className="mt-4 text-base font-semibold text-white">{program.title}</h2>
            <p className="mt-2 text-xs text-slate-400">{program.description}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Upcoming gatherings</h2>
            <p className="text-xs text-slate-400">
              Invitations are reserved for XFA Platform clients and strategic partners.
            </p>
          </div>
          <a
            href="mailto:community@x-fa.com"
            className="inline-flex items-center gap-2 rounded-full border border-blue-400/60 px-4 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/10"
          >
            Request invite <Users className="size-4" />
          </a>
        </div>
        <div className="mt-4 space-y-4">
          {upcoming.map((event) => (
            <div
              key={event.title}
              className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-white">{event.title}</p>
                <p className="text-xs text-slate-400">{event.speakers}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="size-4" />
                {event.date}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-purple-600/20 p-6 text-white shadow-xl backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Join the XFA Platform allocator guild</h2>
            <p className="text-xs text-blue-100">
              Private forums, shared diligence notes, and curated introductions across our network of
              institutional clients.
            </p>
          </div>
          <a
            href="https://community.XFA Platform.com"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-semibold text-blue-700 transition hover:bg-slate-100"
          >
            Access portal <ArrowRight className="size-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
