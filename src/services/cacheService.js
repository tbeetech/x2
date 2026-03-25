/**
 * Cache Service
 * Handles client-side cache management and version control
 * Prevents stale data issues on mobile browsers
 */
import packageInfo from "../../package.json";

const APP_VERSION_KEY = "xfa_app_version";
const CACHE_TIMESTAMP_KEY = "xfa_cache_timestamp";
const AUTH_PERSIST_KEYS = [
  "auth_token",
  "authToken",
  "refreshToken",
  "refreshExpiresAt",
  "authUserId",
  "auth_user_cache",
];

function readMetaVersion() {
  if (typeof document === "undefined") {
    return undefined;
  }
  const value = document.querySelector('meta[name="app-version"]')?.getAttribute("content");
  return value?.trim() || undefined;
}

function resolveCurrentVersion() {
  const envVersion = import.meta.env?.VITE_APP_VERSION;
  if (typeof envVersion === "string" && envVersion.trim()) {
    return envVersion.trim();
  }

  const globalVersion =
    typeof globalThis !== "undefined" && typeof globalThis.__APP_VERSION__ === "string"
      ? globalThis.__APP_VERSION__.trim()
      : "";
  if (globalVersion) {
    return globalVersion;
  }

  const metaVersion = readMetaVersion();
  if (metaVersion) {
    return metaVersion;
  }

  const packageVersion =
    typeof packageInfo?.version === "string" && packageInfo.version.trim()
      ? packageInfo.version.trim()
      : "";
  if (packageVersion) {
    return packageVersion;
  }

  // Final fallback - static semantic version
  return "1.0.0";
}

const CURRENT_VERSION = resolveCurrentVersion();

/**
 * Check if app version has changed and clear cache if needed
 */
export function checkAndClearStaleCache() {
  if (typeof window === "undefined") return;

  try {
    const storedVersion = localStorage.getItem(APP_VERSION_KEY);
    const currentVersion = CURRENT_VERSION;

    // If version changed, clear all cached data
    if (storedVersion && storedVersion !== currentVersion) {
      console.info(`App updated from ${storedVersion} to ${currentVersion}. Clearing cache...`);
      clearAppCache();
    }

    // Update version
    localStorage.setItem(APP_VERSION_KEY, currentVersion);
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.warn("Unable to check cache version:", error);
  }
}

/**
 * Clear all app cache (localStorage, sessionStorage)
 */
export function clearAppCache() {
  if (typeof window === "undefined") return;

  try {
    const preservedEntries = new Map();
    AUTH_PERSIST_KEYS.forEach((key) => {
      try {
        const value = localStorage.getItem(key);
        if (value !== null && value !== undefined) {
          preservedEntries.set(key, value);
        }
      } catch {
        // Ignore storage read errors for individual keys
      }
    });

    const keysToDelete = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) continue;
      if (!preservedEntries.has(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore individual delete failures
      }
    });

    preservedEntries.forEach((value, key) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // ignore restore failure
      }
    });

    // Clear sessionStorage
    sessionStorage.clear();

    console.info("App cache cleared successfully");
  } catch (error) {
    console.error("Failed to clear cache:", error);
  }
}

/**
 * Force reload the page with cache bypass
 */
export function forceReload() {
  if (typeof window === "undefined") return;

  try {
    // Use hard reload to bypass cache
    window.location.reload(true);
  } catch {
    // Fallback for browsers that don't support hard reload
    window.location.href = window.location.href + "?nocache=" + Date.now();
  }
}

/**
 * Check if cache is stale (older than X minutes)
 */
export function isCacheStale(maxAgeMinutes = 5) {
  if (typeof window === "undefined") return false;

  try {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return true;

    const age = Date.now() - parseInt(timestamp, 10);
    const maxAge = maxAgeMinutes * 60 * 1000;

    return age > maxAge;
  } catch {
    return false;
  }
}

/**
 * Update cache timestamp
 */
export function updateCacheTimestamp() {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.warn("Unable to update cache timestamp:", error);
  }
}

/**
 * Get current app version
 */
export function getAppVersion() {
  return CURRENT_VERSION;
}

/**
 * Initialize cache service on app load
 */
export function initCacheService() {
  checkAndClearStaleCache();

  // Check for stale cache on page visibility change (user returns to tab)
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        if (isCacheStale(5)) {
          updateCacheTimestamp();
          // Optionally force reload if data is very stale
          if (isCacheStale(30)) {
            console.info("Cache is very stale. Reloading...");
            forceReload();
          }
        }
      }
    });
  }

  console.info(`Cache service initialized. Version: ${CURRENT_VERSION}`);
}
