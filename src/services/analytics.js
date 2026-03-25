const isDev = import.meta.env.DEV;
const shouldLog = (import.meta.env.VITE_ENABLE_ANALYTICS_LOGS ?? (isDev ? "false" : "false"))
  .toString()
  .toLowerCase() === "true";

function log(method, payload) {
  if (!shouldLog) {
    return;
  }
  const writer = console[method] ?? console.log;
  writer.call(console, "[analytics]", payload);
}

export function trackEvent(name, properties = {}) {
  log("info", { type: "event", name, properties, timestamp: new Date().toISOString() });
}

export function trackError(error, context = {}) {
  log("error", { type: "error", error: error?.message ?? error, context, timestamp: new Date().toISOString() });
}

export function trackPageview(path, metadata = {}) {
  log("info", { type: "page", path, metadata, timestamp: new Date().toISOString() });
}

export function withAnalytics(actionName, fn) {
  return async (...args) => {
    trackEvent(`action:${actionName}:start`);
    try {
      const result = await fn(...args);
      trackEvent(`action:${actionName}:success`);
      return result;
    } catch (error) {
      trackError(error, { action: actionName });
      throw error;
    }
  };
}
