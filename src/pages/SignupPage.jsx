import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoaderOverlay } from "../components/LoaderOverlay";
import { Activity, AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { CountrySelect } from "../components/CountrySelect.jsx";
import { logger } from "../services/logger";

// Password validation function matching server-side requirements
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    minLength: password.length >= minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar,
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
  };
}

export function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    country: "",
    phone: "",
    agreeTos: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const { signup } = useAuth();

  const passwordValidation = validatePassword(formData.password);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    // Client-side validation
    if (!formData.firstName.trim()) {
      setError("First name is required.");
      return;
    }
    if (!formData.lastName.trim()) {
      setError("Last name is required.");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (!formData.country || !formData.country.trim()) {
      setError("Country is required.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (!formData.password) {
      setError("Password is required.");
      return;
    }
    if (!passwordValidation.isValid) {
      setError("Password does not meet all security requirements. Please check the requirements below.");
      setPasswordTouched(true);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please double-check and try again.");
      return;
    }
    if (!formData.agreeTos) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await signup({
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        country: formData.country?.trim() || "",
        phone: formData.phone?.trim() || "",
      });

      if (response?.error) {
        setError(response.error);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 1800);
    } catch (err) {
      logger.error("Signup error", err);
      setError(err.message || "Failed to create account. Please try again.");
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
        <div className="w-full max-w-md text-center">
          <CheckCircle2 className="mx-auto mb-4 size-16 text-emerald-400" />
          <h1 className="text-2xl font-semibold text-white">Account Created!</h1>
          <p className="mt-2 text-slate-400">
            Redirecting you to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <LoaderOverlay show={submitting} label="Creating your account..." />

      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="mx-auto inline-flex flex-col items-center gap-1">
            <span className="text-2xl font-black tracking-widest text-white">XFA</span>
            <span className="text-[0.5rem] tracking-widest uppercase text-blue-400">A division of Marex</span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-white">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Join the next generation of institutional investing
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <AlertCircle className="mt-0.5 size-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  First name
                </span>
                <input
                  required
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  Last name
                </span>
                <input
                  required
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-400">
                Country of residence
              </span>
              <CountrySelect
                required
                value={formData.country}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    country: value,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-400">
                Phone number
              </span>
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="e.g. +1 555 010 2030"
              />
            </label>

            {/* Timezone field intentionally removed */}

            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-400">
                Email address
              </span>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-400">
                Password
              </span>
              <div className="relative mt-1">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onBlur={() => setPasswordTouched(true)}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {(formData.password || passwordTouched) && (
                <div className="mt-2 space-y-1.5 rounded-lg border border-white/10 bg-white/5 p-3 text-xs">
                  <p className="font-semibold text-slate-300 mb-1.5">Password Requirements:</p>
                  <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {passwordValidation.minLength ? <CheckCircle2 className="size-3" /> : <div className="size-3 rounded-full border border-current" />}
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasUpperCase ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {passwordValidation.hasUpperCase ? <CheckCircle2 className="size-3" /> : <div className="size-3 rounded-full border border-current" />}
                    <span>One uppercase letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasLowerCase ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {passwordValidation.hasLowerCase ? <CheckCircle2 className="size-3" /> : <div className="size-3 rounded-full border border-current" />}
                    <span>One lowercase letter (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasNumbers ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {passwordValidation.hasNumbers ? <CheckCircle2 className="size-3" /> : <div className="size-3 rounded-full border border-current" />}
                    <span>One number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasSpecialChar ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {passwordValidation.hasSpecialChar ? <CheckCircle2 className="size-3" /> : <div className="size-3 rounded-full border border-current" />}
                    <span>One special character (!@#$%^&*...)</span>
                  </div>
                </div>
              )}
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-400">
                Confirm password
              </span>
              <div className="relative mt-1">
                <input
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400">
                  <AlertCircle className="size-3" />
                  Passwords do not match
                </p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="size-3" />
                  Passwords match
                </p>
              )}
            </label>
          </div>

          <label className="flex items-start gap-3">
            <input
              required
              type="checkbox"
              checked={formData.agreeTos}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, agreeTos: e.target.checked }))
              }
              className="mt-1 rounded border-white/10 bg-white/5 text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <span className="text-sm text-slate-300">
              I agree to the{" "}
              <Link
                to="/terms"
                className="text-blue-400 underline hover:text-blue-300"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="text-blue-400 underline hover:text-blue-300"
              >
                Privacy Policy
              </Link>
            </span>
          </label>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-400 hover:to-purple-500"
          >
            Create Account <ArrowRight className="size-4" />
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-400 hover:text-blue-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
