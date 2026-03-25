export function isPrimaryWorker() {
  const candidates = [
    process.env.pm_id,
    process.env.PM_ID,
    process.env.NODE_APP_INSTANCE,
    process.env.CLUSTER_WORKER_ID,
  ];
  
  for (const candidate of candidates) {
    if (candidate !== undefined) {
      return String(candidate) === "0";
    }
  }
  
  // When no clustering metadata is present (local dev, single process),
  // treat the current process as the primary worker.
  return true;
}
