import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchSiteContent as fetchSiteContentApi,
  fetchAdminSiteContent,
  saveSiteContentEntry,
} from "../services/apiClient.js";

const SiteContentContext = createContext(null);

function toMap(entries = []) {
  const map = new Map();
  for (const entry of entries) {
    map.set(entry.key, { ...entry });
  }
  return map;
}

function normalizeLocale(locale) {
  return (locale ?? "en").toLowerCase();
}

export function SiteContentProvider({ children, defaultLocale = "en" }) {
  const [locale, setLocale] = useState(normalizeLocale(defaultLocale));
  const [activeLocale, setActiveLocale] = useState(normalizeLocale(defaultLocale));
  const [entries, setEntries] = useState([]);
  const [entryMap, setEntryMap] = useState(() => toMap(entries));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [adminState, setAdminState] = useState({
    entries: [],
    locale: null,
    loading: false,
    error: null,
  });

  const load = useCallback(
    async (targetLocale = locale) => {
      const nextLocale = normalizeLocale(targetLocale);
      setLoading(true);
      try {
        const response = await fetchSiteContentApi(nextLocale);
        const resolvedLocale = normalizeLocale(response.locale ?? nextLocale);
        const resolvedEntries = response.entries ?? [];
        setEntries(resolvedEntries);
        setEntryMap(toMap(resolvedEntries));
        setActiveLocale(resolvedLocale);
        setError(null);
      } catch (fetchError) {
        setError(fetchError);
      } finally {
        setLoading(false);
      }
    },
    [locale],
  );

  useEffect(() => {
    load(locale);
  }, [locale, load]);

  const refresh = useCallback(() => load(locale), [load, locale]);

  const getString = useCallback(
    (key, fallback) => {
      const entry = entryMap.get(key);
      if (!entry || typeof entry.value !== "string") {
        return typeof fallback === "string" ? fallback : key;
      }
      return entry.value;
    },
    [entryMap],
  );

  const loadAdminCatalog = useCallback(
    async (targetLocale) => {
      setAdminState((prev) => ({ ...prev, loading: true }));
      try {
        const response = await fetchAdminSiteContent(targetLocale);
        setAdminState({
          entries: response.entries ?? [],
          locale: response.locale ? normalizeLocale(response.locale) : null,
          loading: false,
          error: null,
        });
        return response.entries ?? [];
      } catch (catalogError) {
        setAdminState((prev) => ({ ...prev, loading: false, error: catalogError }));
        throw catalogError;
      }
    },
    [],
  );

  const saveEntry = useCallback(
    async ({ key, value, locale: entryLocale, description, tags }) => {
      const payload = {
        key,
        value,
        locale: entryLocale ? normalizeLocale(entryLocale) : activeLocale,
        description,
        tags,
      };
      const response = await saveSiteContentEntry(payload);
      const responseLocale = normalizeLocale(response.locale ?? payload.locale);

      // Update admin cache
      setAdminState((prev) => {
        const nextEntries = [...prev.entries];
        const index = nextEntries.findIndex(
          (entry) => entry.key === response.key && normalizeLocale(entry.locale) === responseLocale,
        );
        const nextEntry = {
          key: response.key ?? payload.key,
          value: response.value ?? payload.value,
          locale: responseLocale,
          description: response.description ?? payload.description ?? "",
          tags: response.tags ?? payload.tags ?? [],
          id: response.id ?? payload.id ?? `${response.key}-${responseLocale}`,
        };
        if (index >= 0) {
          nextEntries[index] = { ...nextEntries[index], ...nextEntry };
        } else {
          nextEntries.push(nextEntry);
          nextEntries.sort((a, b) => {
            if (a.key === b.key) {
              return a.locale.localeCompare(b.locale);
            }
            return a.key.localeCompare(b.key);
          });
        }
        return {
          ...prev,
          entries: nextEntries,
          error: null,
        };
      });

      // Update runtime map if locale matches active
      if (responseLocale === activeLocale) {
        setEntries((prev) => {
          const nextEntries = [...prev];
          const index = nextEntries.findIndex((entry) => entry.key === payload.key);
          const merged = {
            key: payload.key,
            value: response.value ?? payload.value,
            locale: responseLocale,
            description: response.description ?? payload.description ?? "",
          };
          if (index >= 0) {
            nextEntries[index] = merged;
          } else {
            nextEntries.push(merged);
          }
          return nextEntries;
        });
        setEntryMap((prev) => {
          const next = new Map(prev);
          next.set(payload.key, {
            key: payload.key,
            value: response.value ?? payload.value,
            locale: responseLocale,
            description: response.description ?? payload.description ?? "",
          });
          return next;
        });
      }

      return response;
    },
    [activeLocale],
  );

  const contextValue = useMemo(() => {
    return {
      locale,
      activeLocale,
      loading,
      error,
      entries,
      getString,
      setLocale: (nextLocale) => setLocale(normalizeLocale(nextLocale)),
      refresh,
      admin: {
        ...adminState,
        loadCatalog: loadAdminCatalog,
        saveEntry,
      },
    };
  }, [locale, activeLocale, loading, error, entries, getString, refresh, adminState, loadAdminCatalog, saveEntry]);

  return <SiteContentContext.Provider value={contextValue}>{children}</SiteContentContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error("useSiteContent must be used within a SiteContentProvider");
  }
  return context;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSiteCopy(key, fallback) {
  const { getString } = useSiteContent();
  return getString(key, fallback);
}
