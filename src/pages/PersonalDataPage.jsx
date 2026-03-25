import { useEffect, useMemo, useState } from "react";
import { User, Lock, CheckCircle2 } from "lucide-react";
import { useAccountData } from "../context/AccountDataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { CountrySelect } from "../components/CountrySelect.jsx";
import { toast } from "react-toastify";

function Field({ label, value = "", onChange, type = "text" }) {
  return (
    <label className="block text-sm text-slate-300">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      />
    </label>
  );
}

export function PersonalDataPage() {
  const { user: accountUser } = useAccountData();
  const { user: authUser, updateProfile } = useAuth();
  const effectiveUser = useMemo(() => accountUser ?? authUser ?? {}, [accountUser, authUser]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    timezone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      firstName: effectiveUser.firstName ?? "",
      lastName: effectiveUser.lastName ?? "",
      email: effectiveUser.email ?? "",
      phone: effectiveUser.phone ?? "",
      country: effectiveUser.country ?? "",
      timezone: effectiveUser.timezone ?? "",
    }));
  }, [effectiveUser]);

  async function handleSave(e) {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("authToken");
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      const data = await response.json();
      
      // Update local state with the saved data
      if (data.user) {
        updateProfile(data.user);
      }

      // Show success toast
      toast.success("Changes saved successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error(error.message || "Failed to save changes. Please try again.", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    // Check new password length
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    // Check if passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    // Call backend API to change password
    try {
      const response = await fetch("/api/auth/password/change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token") || localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to change password");
      }
      
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      
      // Show success toast
      toast.success("Password changed successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess(false);
      }, 3000);
    } catch (error) {
      setPasswordError(error.message || "Unable to update password. Please try again.");
      toast.error(error.message || "Failed to change password. Please try again.", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 pb-20">
      <div className="mb-6 flex items-center gap-3">
        <User className="size-6 text-blue-400" />
        <div>
          <h1 className="text-2xl font-semibold text-white">Personal Data</h1>
          <p className="text-sm text-slate-400">Manage your personal information that appears on your profile.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="First name" value={form.firstName} onChange={(v) => setForm((p) => ({ ...p, firstName: v }))} />
          <Field label="Last name" value={form.lastName} onChange={(v) => setForm((p) => ({ ...p, lastName: v }))} />
          <Field label="Email address" type="email" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} />
          <Field label="Phone number" value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} />
          <label className="block text-sm text-slate-300">
            <span className="text-xs uppercase tracking-wide text-slate-400">Country</span>
            <CountrySelect value={form.country} onChange={(v) => setForm((p) => ({ ...p, country: v }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" />
          </label>
          <Field label="Timezone" value={form.timezone} onChange={(v) => setForm((p) => ({ ...p, timezone: v }))} />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2 text-sm font-semibold text-white">Save</button>
        </div>
      </form>

      {/* Change Password Section */}
      <div className="mt-8">
        <div className="mb-6 flex items-center gap-3">
          <Lock className="size-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">Change Password</h2>
            <p className="text-sm text-slate-400">Update your password to keep your account secure.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          {passwordSuccess && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              <CheckCircle2 className="mt-0.5 size-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Password changed successfully!</p>
                <p className="mt-1 text-xs text-emerald-300">Your password has been updated.</p>
              </div>
            </div>
          )}

          {passwordError && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {passwordError}
            </div>
          )}

          <div className="grid gap-4">
            <label className="block text-sm text-slate-300">
              <span className="text-xs uppercase tracking-wide text-slate-400">Current Password</span>
              <div className="relative mt-1">
                <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Enter current password"
                  required
                />
              </div>
            </label>

            <label className="block text-sm text-slate-300">
              <span className="text-xs uppercase tracking-wide text-slate-400">New Password</span>
              <div className="relative mt-1">
                <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Enter new password (min. 6 characters)"
                  required
                  minLength={6}
                />
              </div>
            </label>

            <label className="block text-sm text-slate-300">
              <span className="text-xs uppercase tracking-wide text-slate-400">Confirm New Password</span>
              <div className="relative mt-1">
                <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Re-enter new password"
                  required
                  minLength={6}
                />
              </div>
            </label>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-slate-300">
            <p className="font-semibold text-white">Password requirements:</p>
            <ul className="mt-2 space-y-1">
              <li>• At least 6 characters long</li>
              <li>• Mix of letters and numbers recommended</li>
              <li>• Avoid common words or patterns</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button 
              type="submit" 
              className="rounded-full bg-gradient-to-r from-purple-500 to-pink-600 px-5 py-2 text-sm font-semibold text-white transition hover:from-purple-600 hover:to-pink-700"
            >
              Update Password
            </button>
            <button 
              type="button"
              onClick={() => {
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                setPasswordError(null);
                setPasswordSuccess(false);
              }}
              className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PersonalDataPage;
