import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Lock, Mail, Shield } from "lucide-react";
import { LoaderOverlay } from "../components/LoaderOverlay";
import { apiClient } from "../services/apiClient";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  
  const [step, setStep] = useState(tokenFromUrl ? 2 : 1); // 1: Email, 2: Reset password
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(tokenFromUrl || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleEmailSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiClient.requestPasswordReset(normalizedEmail);

      // Show success message with admin review info
      alert(
        "Password reset request submitted successfully!\n\n" +
        "An administrator will review your request shortly. " +
        "You will receive a reset token via your registered contact method.\n\n" +
        "For security reasons, please contact support if you don't receive a response within 24 hours.\n\n" +
        "Support Email: Support@trd-sphere.com"
      );
      setStep(2);
    } catch (err) {
      setError(err?.message || "Unable to send reset request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordReset(e) {
    e.preventDefault();
    
    if (!token.trim()) {
      setError("Reset token is required. Please check your email for the reset link.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiClient.resetPassword({ token: token.trim(), password: newPassword });

      setSuccess(true);
      
      // Redirect to login after success
      setTimeout(() => {
        navigate("/login", { 
          state: { message: "Password reset successfully! Please login with your new password." }
        });
      }, 1500);
    } catch (err) {
      setError(err?.message || "Unable to reset password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-12">
      <LoaderOverlay show={submitting} label={step === 1 ? "Verifying..." : "Resetting password..."} />

      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30">
            <Shield className="size-8 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-white">
            {step === 1 ? "Reset your password" : "Create new password"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {step === 1 
              ? "Submit a password reset request for admin review"
              : "Enter the token provided by support and create your new password"
            }
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          {step === 1 && (
            <div className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
              <p className="font-semibold">🔒 Secure password reset process</p>
              <p className="mt-2 text-xs text-blue-300">
                Your reset request will be reviewed by our admin team. You'll receive a secure token via your registered contact method.
              </p>
            </div>
          )}

          {success && step === 2 && !error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              <CheckCircle2 className="mt-0.5 size-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Password reset successful!</p>
                <p className="mt-1 text-xs text-emerald-300">Redirecting to login page...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-white">
                  Email address
                </label>
                <div className="relative mt-2">
                  <Mail className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-3 font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-6">
              {!tokenFromUrl && (
                <div>
                  <label htmlFor="token" className="block text-sm font-semibold text-white">
                    Reset Token
                  </label>
                  <div className="relative mt-2">
                    <Shield className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="token"
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 font-mono text-white placeholder-slate-500 focus:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Enter token from admin/support"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Contact support if you haven't received your reset token
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="newPassword" className="block text-sm font-semibold text-white">
                  New password
                </label>
                <div className="relative mt-2">
                  <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Enter new password"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white">
                  Confirm password
                </label>
                <div className="relative mt-2">
                  <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Re-enter password"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-slate-300">
                <p className="font-semibold text-white">Password requirements:</p>
                <ul className="mt-2 space-y-1">
                  <li>• At least 8 characters long</li>
                  <li>• Mix of uppercase and lowercase letters</li>
                  <li>• At least one number</li>
                  <li>• At least one special character</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-3 font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset password
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300 transition hover:text-blue-200"
            >
              <ArrowLeft className="size-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
