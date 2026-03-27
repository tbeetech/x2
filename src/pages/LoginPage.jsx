import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, AlertCircle, Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";
import { LoaderOverlay } from "../components/LoaderOverlay";
import { useAuth } from "../context/AuthContext";
import { useSiteCopy } from "../context/SiteContentContext.jsx";
import { logger } from "../services/logger";

const initialForm = {
  email: "",
  password: "",
  remember: true,
};

export function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const { login } = useAuth();
  const loginTitle = useSiteCopy("auth.login.title", "");
  const loginSubtitle = useSiteCopy(
    "auth.login.subtitle",
    "Sign in with your XFA credentials to access your workspace.",
  );
  const submitLabel = useSiteCopy("auth.login.submit", "Sign in");
  const keepSignedInLabel = useSiteCopy("auth.login.keepSignedIn", "Keep me signed in");
  const forgotPasswordLabel = useSiteCopy("auth.login.forgotPassword", "Forgot password?");
  const noAccountLabel = useSiteCopy("auth.login.noAccount", "Don't have an account?");
  const createAccountLabel = useSiteCopy("auth.login.createAccount", "Create one");

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setAttemptsRemaining(null);

    // Client-side validation
    if (!form.email.trim()) {
      setError("Email address is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!form.password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);

    try {
      const result = await login(form.email.trim(), form.password, {
        remember: form.remember,
      });
      
      if (!result.success) {
        setError(result.error || "Invalid email or password");
        if (result.attemptsRemaining !== undefined) {
          setAttemptsRemaining(result.attemptsRemaining);
        }
        if (result.remainingMinutes !== undefined) {
          setError(
            `Account temporarily locked due to multiple failed login attempts. Please try again in ${result.remainingMinutes} minute${result.remainingMinutes !== 1 ? 's' : ''}.`
          );
        }
        setLoading(false);
        return;
      }

      // Success - navigate to appropriate route
      setLoading(false);
      navigate(result.route, { replace: true });
    } catch (err) {
      logger.error("Login error", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <LoaderOverlay show={loading} label="Signing in…" />

      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          {/* <div className="mb-8 flex items-center justify-center gap-2 text-blue-400">
            <Activity className="size-5" />
          
          </div> */}
          <h1 className="text-2xl font-semibold text-white">{loginTitle}</h1>
          <p className="mt-2 text-sm text-slate-400">{loginSubtitle}</p>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <AlertCircle className="mt-0.5 size-5 flex-shrink-0" />
            <div className="flex-1">
              <p>{error}</p>
              {attemptsRemaining !== null && attemptsRemaining > 0 && (
                <p className="mt-1 text-xs text-rose-300">
                  {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before account lockout.
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">
              Email address
            </label>
            <div className="relative mt-2">
              <Mail className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-500" />
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">
              Password
            </label>
            <div className="relative mt-2">
              <Lock className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-12 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, remember: event.target.checked }))
                }
                className="rounded border-white/10 bg-white/5 text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <span className="text-sm text-slate-300">{keepSignedInLabel}</span>
            </label>

            <Link
              to="/forgot-password"
              className="text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              {forgotPasswordLabel}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading || !form.email.trim() || !form.password}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-400 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : submitLabel}
          </button>

          <p className="pt-6 text-center text-sm text-slate-400">
            {noAccountLabel}{" "}
            <Link
              to="/signup"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              {createAccountLabel}
            </Link>
          </p>
        </form>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
          <div className="flex items-center gap-2 text-blue-300">
            <Sparkles className="size-4" />
            <span className="text-xs uppercase tracking-[0.35em]">Platform Features</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>- Real-time asset tracking & analytics</li>
            <li>- Secure multi-currency wallet management</li>
            <li>- Advanced trading & investment tools</li>
            <li>- Comprehensive transaction history</li>
          </ul>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
          <div className="flex items-center gap-2 text-blue-300">
            <Sparkles className="size-4" />
            <span className="text-xs uppercase tracking-[0.35em]">Security & Compliance</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>- Automated compliance monitoring</li>
            <li>- AI-driven rebalancing suggestions</li>
            <li>- Multi-custody asset visibility</li>
          </ul>
        </div>
      </div>
    </>
  );
}




