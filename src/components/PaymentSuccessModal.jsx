import { CheckCircle, X } from "lucide-react";
import { Link } from "react-router-dom";

export function PaymentSuccessModal({ show, onClose }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-slate-900/95 p-8 shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        {/* Success icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-emerald-500/20 p-4">
            <CheckCircle className="size-16 text-emerald-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="mb-3 text-center text-2xl font-bold text-white">
          Payment Sent For Processing
        </h2>

        {/* Description */}
        <p className="mb-8 text-center text-sm text-slate-400">
          Your deposit request has been submitted successfully and is now pending admin approval.
          You'll receive a notification once it's processed.
        </p>

        {/* Dashboard link button */}
        <Link
          to="/dashboard"
          onClick={onClose}
          className="block w-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-400 hover:to-purple-500"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
