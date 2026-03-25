import { X, Clock } from "lucide-react";

export function TradeProcessingModal({ show, onClose, tradeSide = "buy" }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md my-8 rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/95 px-4 py-3 sm:px-6 sm:py-4 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex size-8 sm:size-10 items-center justify-center rounded-full bg-blue-500/20">
              <Clock className="size-4 sm:size-5 text-blue-400 animate-pulse" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-white">Order Processing</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 sm:p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-4 sm:size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 px-3 py-3 sm:px-4 sm:py-4">
            <p className="text-xs sm:text-sm font-semibold text-blue-200">Order submitted successfully</p>
            <p className="mt-1.5 sm:mt-2 text-xs leading-relaxed text-blue-100/80">
              Your {tradeSide} order is being processed. This typically takes within <strong>1-6 hours</strong> for admin review and approval.
            </p>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="mt-0.5 flex size-5 sm:size-6 items-center justify-center rounded-full bg-emerald-500/20 flex-shrink-0">
                <div className="size-1.5 sm:size-2 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-white">Admin Notification Sent</p>
                <p className="mt-0.5 sm:mt-1 text-xs text-slate-400">
                  An administrator has been notified of your {tradeSide} request
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="mt-0.5 flex size-5 sm:size-6 items-center justify-center rounded-full bg-amber-500/20 flex-shrink-0">
                <div className="size-1.5 sm:size-2 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-white">Awaiting Approval</p>
                <p className="mt-0.5 sm:mt-1 text-xs text-slate-400">
                  You'll receive a notification once your order is processed
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 px-3 py-2.5 sm:px-4 sm:py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              What happens next?
            </p>
            <ul className="mt-1.5 sm:mt-2 space-y-1.5 sm:space-y-2 text-xs text-slate-300">
              <li className="flex gap-2">
                <span className="text-blue-400 flex-shrink-0">•</span>
                <span>Admin reviews your order request</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 flex-shrink-0">•</span>
                <span>If approved: Amount deducted and you'll get a confirmation notification</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 flex-shrink-0">•</span>
                <span>If rejected: You'll be notified to retry shortly</span>
              </li>
            </ul>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg transition hover:from-blue-400 hover:to-purple-500"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
