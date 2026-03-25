import { X, Loader2, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PaymentProcessingModal({ show, onClose }) {
  const navigate = useNavigate();
  
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-blue-400/30 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-900/20 shadow-2xl shadow-blue-500/20">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        {/* Content */}
        <div className="px-8 py-12 text-center">
          {/* Animated Icon */}
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-blue-500/20 border-2 border-blue-400/40">
            <Loader2 className="size-10 animate-spin text-blue-400" />
          </div>

          {/* Title */}
          <h2 className="mt-6 text-2xl font-bold text-white">
            Payment is undergoing processing
          </h2>

          {/* Message */}
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            Your deposit is being reviewed by our treasury team. You will be alerted once we confirm your payment.
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Check your notifications or dashboard for updates.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Got it
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/dashboard");
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:from-blue-400 hover:to-purple-500"
            >
              <Home className="size-4" />
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
