import { BookOpen, FileText, Filter, Search, Tag } from "lucide-react";
import { useMemo, useState } from "react";

const articles = [
  {
    title: "Designing institutional-grade crypto policies",
    category: "Governance",
    readingTime: "12 min read",
    summary:
      "A deep dive into withdrawal approvals, emergency shutdowns, disaster recovery, and jurisdictional requirements for sophisticated allocators.",
  },
  {
    title: "Mastering liquidity management across CeFi, DeFi, and OTC desks",
    category: "Treasury",
    readingTime: "15 min read",
    summary:
      "Techniques for maintaining liquidity buffers, automating sweeps, and minimizing counterparty risk while moving capital across venues.",
  },
  {
    title: "Real-time NAV and accounting integrations",
    category: "Reporting",
    readingTime: "9 min read",
    summary:
      "How to connect XFA Platform to Addepar, Black Mountain, Clearwater, and in-house warehouses using our reconciliation APIs and Snowflake connectors.",
  },
  {
    title: "Onboarding DeFi strategies with institutional risk controls",
    category: "DeFi",
    readingTime: "14 min read",
    summary:
      "Operational frameworks for participating in on-chain credit, liquidity provisioning, and governance with integrated compliance checkpoints.",
  },
  {
    title: "Digital asset tax operations playbook",
    category: "Compliance",
    readingTime: "11 min read",
    summary:
      "Country-specific obligations, cost basis tracking, and NAV-ready exports curated from 18 years of XFA Platform tax operations.",
  },
];

const filters = ["All", "Governance", "Treasury", "Reporting", "DeFi", "Compliance"];

export function KnowledgeBasePage() {
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesFilter = selectedFilter === "All" || article.category === selectedFilter;
      const matchesSearch = article.title.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [search, selectedFilter]);

  return (
    <div className="mx-auto max-w-5xl px-6 pb-20">
      <header className="mb-12 space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Knowledge base</p>
        <h1 className="text-3xl font-semibold text-white">Blueprints refined by hundreds of institutions.</h1>
        <p className="text-sm text-slate-400">
          Explore XFA Platformâ€™s playbooks, technical guides, and regulatory mappings distilled from nearly two
          decades of digital asset operations.
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tax, custody, DeFi, reportingâ€¦"
              className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-slate-500" />
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedFilter(filter)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    selectedFilter === filter
                      ? "bg-blue-500 text-white"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        {filteredArticles.map((article) => (
          <article
            key={article.title}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:shadow-blue-500/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
                <Tag className="size-3" />
                {article.category}
              </div>
              <span className="text-xs text-slate-500">{article.readingTime}</span>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-white">{article.title}</h2>
            <p className="mt-2 text-xs text-slate-400">{article.summary}</p>
            <a
              href="#"
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-blue-200 transition hover:text-blue-100"
            >
              Read article <BookOpen className="size-4" />
            </a>
          </article>
        ))}
        {filteredArticles.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-10 text-center text-xs text-slate-400">
            No entries match your filters yet. Email support@x-fa.com and our content team will curate
            the right materials.
          </div>
        )}
      </section>
    </div>
  );
}
