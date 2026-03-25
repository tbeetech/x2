import { useMemo, useState, useCallback } from "react";
import { AlertTriangle, CheckCircle2, Clock, FileText, Loader2, Upload, XCircle } from "lucide-react";
import { useDashboardData } from "../hooks/useDashboardData";
import { useRealTimeUpdates } from "../hooks/useRealTimeUpdates";

const statusStyles = {
  completed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  in_progress: "border-blue-500/40 bg-blue-500/10 text-blue-200",
  pending: "border-amber-500/40 bg-amber-500/10 text-amber-200",
};

export function VerificationPage() {
  const { verification, actions, loading, user, refreshDashboard } = useDashboardData();
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Real-time updates for verification status changes
  const handleVerificationUpdate = useCallback((data) => {
    console.log('[VerificationPage] Received verification update:', data);
    
    // Refresh dashboard to get updated verification status
    if (refreshDashboard) {
      refreshDashboard();
    }
    
    // Show appropriate message based on status
    if (data.status === 'approved') {
      setMessage('ðŸŽ‰ Congratulations! Your account has been verified and approved.');
      setError(null);
    } else if (data.status === 'rejected') {
      setError('Your verification was not approved. Please contact support for assistance.');
      setMessage(null);
    } else if (data.status === 'in_review') {
      setMessage('Your documents are now under review by our compliance team.');
      setError(null);
    }
  }, [refreshDashboard]);
  
  // Subscribe to real-time verification updates
  useRealTimeUpdates(
    user?.id,
    null, // No balance update handler needed here
    handleVerificationUpdate
  );
  
  const requirementItems = [
    "ID (identification card â€“ both sides if available).",
    "Confirmation of actual residential address with a registration date no older than 3 months (utility bill, insurance statement, etc.).",
    "Declaration of deposits â€“ send a list of your deposit transactions with method, amount, and date from the email registered with XFA Platform to compliance@trd-sphere.com.",
  ];

  const groupedTimeline = useMemo(() => {
    return verification.reduce(
      (acc, item) => {
        acc[item.status] = [...(acc[item.status] ?? []), item];
        return acc;
      },
      { completed: [], in_progress: [], pending: [] },
    );
  }, [verification]);

  const hasSubmittedDocuments = verification.length > 0;
  const normalizedStatus = (user?.verificationStatus ?? "pending").toLowerCase();
  const hasCompletedEvent = verification.some((item) => (item.status ?? "").toLowerCase() === "completed");
  const statusBadge = useMemo(() => {
    // Approved/Verified - green shield
    if (hasCompletedEvent || ["approved", "verified", "completed"].includes(normalizedStatus)) {
      return {
        label: "Verified",
        className: "border border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
      };
    }
    // Documents submitted - under review (amber/yellow)
    if (hasSubmittedDocuments) {
      return {
        label: "Under review",
        className: "border border-amber-500/40 bg-amber-500/10 text-amber-200",
      };
    }
    // No documents submitted - not verified (red)
    return {
      label: "Not verified",
      className: "border border-rose-500/40 bg-rose-500/10 text-rose-200",
    };
  }, [hasCompletedEvent, hasSubmittedDocuments, normalizedStatus]);

  function handleFileChange(event) {
    const files = Array.from(event.target.files ?? []);
    setDocuments(files);
    if (files.length) {
      setError(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!documents.length) {
      setError("Please upload at least one identity document before submitting.");
      return;
    }
    if (!actions?.submitVerificationDocuments) {
      setError("Verification submission is temporarily unavailable. Please try again shortly.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await actions.submitVerificationDocuments({ files: documents });
      setMessage("Documents submitted. Compliance will review and update your status shortly.");
      setDocuments([]);
    } catch (err) {
      setError(err?.message ?? "Unable to submit documents. Please retry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 pb-20">
      <div className="mb-10 space-y-3">
        <h1 className="text-3xl font-semibold text-white">Identity verification</h1>
        <p className="text-sm text-slate-400">
          XFA Platform follows institutional compliance requirements. Submit the remaining documents to unlock higher limits and institutional features.
        </p>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadge.className}`}>
          {statusBadge.label}
        </span>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-amber-200" />
          <div>
            <p className="font-semibold">Action required</p>
            <p className="text-xs text-amber-100/80">{error}</p>
          </div>
        </div>
      )}

      {message && (
        <div className="mb-8 rounded-2xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
          {message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur"
      >
        <div className="flex items-center gap-3">
          <FileText className="size-5 text-blue-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">Upload required documents</h2>
            <p className="text-xs text-slate-500">
              Accepts PDF, JPG, and PNG up to 10MB. Encrypted in transit and at rest.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Requirements</p>
              <p className="text-xs text-slate-500">
                Align submissions with compliance expectations to avoid delays.
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          </div>
          <ul className="list-disc space-y-2 pl-5 text-xs text-slate-300">
            {requirementItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-10 text-sm text-slate-300 transition hover:border-blue-400 hover:bg-blue-500/10">
          <Upload className="size-6 text-blue-300" />
          <span>
            Drag and drop files or{" "}
            <span className="text-blue-300 underline">browse your device</span>
          </span>
          <input
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {documents.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-wide text-slate-400">Files ready for submission</p>
            <ul className="mt-3 space-y-2">
              {documents.map((file) => (
                <li
                  key={file.name}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-2"
                >
                  <span>{file.name}</span>
                  <span className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || loading}
          className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-400 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Submittingâ€¦
            </span>
          ) : (
            "Submit for review"
          )}
        </button>
      </form>

      <section className="mt-10 space-y-6">
        <h2 className="text-lg font-semibold text-white">Verification progress</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <StatusCard
            title="Completed"
            status="completed"
            count={groupedTimeline.completed.length}
            icon={CheckCircle2}
          />
          <StatusCard
            title="In review"
            status="in_progress"
            count={groupedTimeline.in_progress.length}
            icon={Clock}
          />
          <StatusCard
            title="Pending"
            status="pending"
            count={groupedTimeline.pending.length}
            icon={XCircle}
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
          <div className="space-y-4 text-sm text-slate-300">
            {verification.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border px-4 py-3 ${statusStyles[item.status]}`}
              >
                <p className="font-semibold text-white">{item.title}</p>
                <p className="text-xs opacity-90">{item.description}</p>
                <p className="mt-2 text-xs opacity-70">
                  {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusCard({ title, status, count, icon: IconComponent }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-5 text-sm shadow-lg backdrop-blur ${statusStyles[status]}`}
    >
      <div className="flex items-center gap-3">
        <IconComponent className="size-5" />
        <p className="text-lg font-semibold text-white">{count}</p>
      </div>
      <p className="mt-2 text-xs uppercase tracking-wide text-white/80">{title}</p>
    </div>
  );
}
