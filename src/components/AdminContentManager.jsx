import { useEffect, useMemo, useState } from "react";
import { FileText, Globe, Loader2, RefreshCw, Save, Sparkles } from "lucide-react";
import { useSiteContent } from "../context/SiteContentContext.jsx";
import { logger } from "../services/logger";

function groupEntries(entries = []) {
  const grouped = new Map();
  for (const entry of entries) {
    if (!grouped.has(entry.key)) {
      grouped.set(entry.key, []);
    }
    grouped.get(entry.key).push(entry);
  }
  for (const localeList of grouped.values()) {
    localeList.sort((a, b) => a.locale.localeCompare(b.locale));
  }
  return grouped;
}

export function AdminContentManager() {
  const { admin, activeLocale, refresh } = useSiteContent();
  const { loadCatalog, saveEntry, entries, loading: adminLoading, error: adminError } = admin;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKey, setSelectedKey] = useState(null);
  const [draftLocale, setDraftLocale] = useState(activeLocale ?? "en");
  const [draftValue, setDraftValue] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    loadCatalog().catch((error) => {
      logger.error("Failed to load content catalog", error);
    });
  }, [loadCatalog]);

  const groupedEntries = useMemo(() => groupEntries(entries), [entries]);

  const filteredKeys = useMemo(() => {
    if (!searchTerm.trim()) {
      return Array.from(groupedEntries.keys());
    }
    const lowered = searchTerm.toLowerCase();
    return Array.from(groupedEntries.keys()).filter((key) => key.toLowerCase().includes(lowered));
  }, [groupedEntries, searchTerm]);

  useEffect(() => {
    if (!selectedKey && filteredKeys.length > 0) {
      setSelectedKey(filteredKeys[0]);
    } else if (selectedKey && !filteredKeys.includes(selectedKey) && filteredKeys.length > 0) {
      setSelectedKey(filteredKeys[0]);
    }
  }, [filteredKeys, selectedKey]);

  const entriesForKey = useMemo(() => {
    if (!selectedKey) return [];
    return groupedEntries.get(selectedKey) ?? [];
  }, [groupedEntries, selectedKey]);

  const currentEntry = useMemo(
    () => entriesForKey.find((entry) => entry.locale === draftLocale),
    [entriesForKey, draftLocale],
  );

  useEffect(() => {
    if (!selectedKey) {
      setDraftValue("");
      setDraftDescription("");
      return;
    }
    if (currentEntry) {
      setDraftValue(currentEntry.value ?? "");
      setDraftDescription(currentEntry.description ?? "");
      return;
    }
    if (entriesForKey.length > 0) {
      const fallback =
        entriesForKey.find((entry) => entry.locale === activeLocale) ??
        entriesForKey.find((entry) => entry.locale === "en") ??
        entriesForKey[0];
      if (fallback) {
        setDraftLocale(fallback.locale);
        setDraftValue(fallback.value ?? "");
        setDraftDescription(fallback.description ?? "");
      }
    } else {
      setDraftValue("");
      setDraftDescription("");
    }
  }, [selectedKey, currentEntry, entriesForKey, activeLocale]);

  const handleLocaleChipClick = (locale) => {
    setDraftLocale(locale);
  };

  const handleNewLocale = () => {
    if (!draftLocale.trim()) {
      setDraftLocale("en");
    }
    setDraftValue("");
    setDraftDescription("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!selectedKey) return;
    try {
      setSaving(true);
      setStatus(null);
      await saveEntry({
        key: selectedKey,
        locale: draftLocale,
        value: draftValue,
        description: draftDescription,
      });
      setStatus({ type: "success", message: "Content saved successfully." });
      await refresh();
    } catch (error) {
      logger.error("Failed to save content", error);
      setStatus({ type: "error", message: error.message ?? "Unable to save content." });
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setStatus(null);
      await loadCatalog();
      await refresh();
      setStatus({ type: "info", message: "Content reloaded." });
    } catch (error) {
      logger.error("Failed to refresh content", error);
      setStatus({ type: "error", message: "Refresh failed. Please try again." });
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-lg backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Context management</p>
          <h2 className="mt-2 text-lg font-semibold text-white truncate">Interface copy & translation</h2>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-full border border-blue-500/40 px-4 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/10 min-h-[40px] shrink-0"
        >
          <RefreshCw className="size-4 shrink-0" /> Refresh
        </button>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-400">
            <FileText className="size-4 text-blue-300 shrink-0" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none min-w-0"
              placeholder="Search content keys..."
            />
          </label>
          <ul className="mt-4 max-h-[340px] space-y-2 overflow-y-auto pr-2 text-sm">
            {filteredKeys.map((key) => {
              const localesCount = groupedEntries.get(key)?.length ?? 0;
              const active = key === selectedKey;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setSelectedKey(key)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition min-h-[48px] ${
                      active
                        ? "border-blue-500/60 bg-blue-500/10 text-white"
                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    <span className="block text-xs uppercase tracking-wide text-slate-400 break-words">{key}</span>
                    <span className="mt-1 inline-flex items-center gap-2 text-xs text-slate-400">
                      <Globe className="size-3 shrink-0" /> {localesCount} locale{localesCount === 1 ? "" : "s"}
                    </span>
                  </button>
                </li>
              );
            })}
            {filteredKeys.length === 0 && (
              <li className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
                No content keys matched your search.
              </li>
            )}
          </ul>
        </div>

        <form
          onSubmit={handleSave}
          className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 text-sm text-slate-200"
        >
          {selectedKey ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Editing</p>
                  <h3 className="text-lg font-semibold text-white break-words">{selectedKey}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {entriesForKey.map((entry) => (
                    <button
                      type="button"
                      key={`${entry.key}-${entry.locale}`}
                      onClick={() => handleLocaleChipClick(entry.locale)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition min-h-[32px] ${
                        entry.locale === draftLocale
                          ? "border-blue-500/70 bg-blue-500/20 text-blue-100"
                          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      {entry.locale.toUpperCase()}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleNewLocale}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-white/10 min-h-[32px]"
                  >
                    <Sparkles className="size-4 text-blue-300 shrink-0" /> 
                    <span className="hidden sm:inline">New locale</span>
                    <span className="sm:hidden">New</span>
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                <label className="text-xs uppercase tracking-wide text-slate-500">
                  Locale code
                  <input
                    required
                    value={draftLocale}
                    onChange={(event) => setDraftLocale(event.target.value.toLowerCase())}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="en"
                    maxLength={8}
                  />
                </label>
                <label className="text-xs uppercase tracking-wide text-slate-500">
                  Description (optional)
                  <input
                    value={draftDescription}
                    onChange={(event) => setDraftDescription(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="Where this copy is used"
                  />
                </label>
              </div>

              <label className="text-xs uppercase tracking-wide text-slate-500">
                Content value
                <textarea
                  required
                  value={draftValue}
                  onChange={(event) => setDraftValue(event.target.value)}
                  rows={6}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y"
                  placeholder="Enter the copy for this locale..."
                />
              </label>

              {status && (
                <p
                  className={`rounded-xl border px-3 py-2 text-xs break-words ${
                    status.type === "success"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                      : status.type === "error"
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                      : "border-blue-500/30 bg-blue-500/10 text-blue-100"
                  }`}
                >
                  {status.message}
                </p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end text-xs">
                <button
                  type="submit"
                  disabled={saving || !draftValue.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2 font-semibold text-white shadow transition hover:from-blue-400 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-60 min-h-[40px]"
                >
                  {saving ? <Loader2 className="size-4 animate-spin shrink-0" /> : <Save className="size-4 shrink-0" />}
                  Save changes
                </button>
              </div>
            </>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-slate-400 p-4">
              <FileText className="size-10 text-slate-500" />
              <p className="text-sm text-center">Select a content key to begin editing.</p>
            </div>
          )}
        </form>
      </div>

      {adminLoading && (
        <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="size-4 animate-spin" /> Loading content catalog…
        </div>
      )}
      {adminError && (
        <p className="mt-3 text-xs text-rose-300">
          Unable to load content catalog. Please refresh or check your network connection.
        </p>
      )}
    </section>
  );
}
