import { Link } from "react-router-dom";
import { useSiteContent } from "../context/SiteContentContext.jsx";

const PLATFORM_LINKS = [
  { to: "/dashboard", key: "footer.platform.dashboard", fallback: "Dashboard" },
  { to: "/market", key: "footer.platform.market", fallback: "Markets" },
  { to: "/investments", key: "footer.platform.investments", fallback: "Investments" },
];

const RESOURCE_LINKS = [
  { to: "/knowledge-base", key: "footer.resources.knowledge", fallback: "Knowledge Base" }
];

const SUPPORT_LINKS = [
  { to: "/status", key: "footer.support.status", fallback: "Status" },
  { to: "/help-center", key: "footer.support.help", fallback: "Help Center" },
  { to: "/security", key: "footer.support.security", fallback: "Security" },
];

export function SiteFooter() {
  const { getString } = useSiteContent();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-slate-950/80 py-10 text-slate-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4 md:w-1/3">
          <div className="flex items-center gap-2 text-white">
            <div className="flex flex-col leading-none">
              <span className="text-xl font-black tracking-widest">XFA</span>
              <span className="text-[0.5rem] tracking-widest uppercase text-blue-400">A division of Marex</span>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            Smart cryptocurrency investing with real-time market intelligence, automated insights, and rich
            analytics for institutional allocators.
          </p>
          <p className="text-xs text-slate-500">
            (c) {currentYear} XFA &mdash; A division of Marex. All rights reserved.
          </p>
        </div>

        <div className="grid flex-1 gap-8 text-sm sm:grid-cols-2 md:grid-cols-3">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Platform</span>
            <nav className="flex flex-col gap-2">
              {PLATFORM_LINKS.map((link) => (
                <Link key={link.key} className="transition hover:text-blue-400" to={link.to}>
                  {getString(link.key, link.fallback)}
                </Link>
              ))}
            </nav>
          </div>
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resources</span>
            <nav className="flex flex-col gap-2 text-slate-300">
              {RESOURCE_LINKS.map((link) => (
                <Link key={link.key} className="transition hover:text-blue-400" to={link.to}>
                  {getString(link.key, link.fallback)}
                </Link>
              ))}
            </nav>
          </div>
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Support</span>
            <nav className="flex flex-col gap-2 text-slate-300">
              {SUPPORT_LINKS.map((link) => (
                <Link key={link.key} className="transition hover:text-blue-400" to={link.to}>
                  {getString(link.key, link.fallback)}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
