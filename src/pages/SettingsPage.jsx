import { useMemo, useState } from "react";
import { Smartphone, UserCog, Lock, CheckCircle2 } from "lucide-react";
import { useAccountData } from "../context/AccountDataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { CountrySelect } from "../components/CountrySelect.jsx";
import { apiClient } from "../services/apiClient";

const deriveSettings = (user) => ({
  email: user?.email ?? "",
  firstName: user?.firstName ?? "",
  lastName: user?.lastName ?? "",
  country: user?.country ?? "",
  phone: user?.phone ?? "",
  timezone: user?.timezone ?? "UTC",
  alerts: {
    price: user?.preferences?.alerts?.price ?? true,
    portfolio: user?.preferences?.alerts?.portfolio ?? true,
  },
});

function mergeProfile(user = {}, settings) {
  return {
    ...user,
    firstName: settings.firstName,
    lastName: settings.lastName,
    email: settings.email,
    country: settings.country,
    phone: settings.phone,
    timezone: settings.timezone,
    preferences: {
      ...(user?.preferences ?? {}),
      alerts: {
        ...(user?.preferences?.alerts ?? {}),
        ...(settings.alerts ?? {}),
      },
    },
  };
}

export function SettingsPage() {
  const { user: accountUser, summary, wallet, loading } = useAccountData();
  const { user: authUser, updateProfile } = useAuth();
  const effectiveUser = useMemo(() => accountUser ?? authUser ?? null, [accountUser, authUser]);

  const [settings, setSettings] = useState(() => deriveSettings(effectiveUser));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    try {
      const updatedUser = mergeProfile(effectiveUser, settings);
      updateProfile(updatedUser);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (submitError) {
      console.error("Settings update failed", submitError);
      setError("Unable to update settings locally. Please try again.");
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault();
    setPasswordError(null);
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    
    setPasswordChanging(true);
    
    try {
      // Call password change API
      const response = await fetch(apiClient.config.apiBaseUrl + "/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: effectiveUser?.email,
          currentPassword,
          newPassword,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Password change failed");
      }
      
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      console.error("Password change failed", err);
      setPasswordError("Unable to change password. Verify your current password and try again.");
    } finally {
      setPasswordChanging(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-slate-400">
          Manage your account profile, notification preferences, and security posture.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur"
      >
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <span className="text-lg">?</span>
            <p>{error}</p>
          </div>
        )}

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <UserCog className="size-5 text-blue-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Profile</h2>
              <p className="text-xs text-slate-500">
                Keep your KYC information up to date for guaranteed service continuity.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="First name"
              value={settings.firstName}
              onChange={(value) => setSettings((prev) => ({ ...prev, firstName: value }))}
            />
            <Field
              label="Last name"
              value={settings.lastName}
              onChange={(value) => setSettings((prev) => ({ ...prev, lastName: value }))}
            />
            <Field
              label="Email address"
              type="email"
              value={settings.email}
              onChange={(value) => setSettings((prev) => ({ ...prev, email: value }))}
            />
          <Field
            label="Phone number"
            value={settings.phone}
            onChange={(value) => setSettings((prev) => ({ ...prev, phone: value }))}
          />
          <label className="block text-sm text-slate-300">
            <span className="text-xs uppercase tracking-wide text-slate-400">Country</span>
            <CountrySelect
              value={settings.country}
              onChange={(value) => setSettings((prev) => ({ ...prev, country: value }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Choose your country"
            />
          </label>
          <Field
            label="Timezone"
            value={settings.timezone}
            onChange={(value) => setSettings((prev) => ({ ...prev, timezone: value }))}
          />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Smartphone className="size-5 text-blue-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
              <p className="text-xs text-slate-500">
                Control when XFA Platform reaches out with market insights and risk alerts.
              </p>
            </div>
          </div>

          <ToggleRow
            label="Price alerts"
            description="Real-time alerts when assets move more than your configured thresholds."
            enabled={settings.alerts.price}
            onToggle={(value) =>
              setSettings((prev) => ({
                ...prev,
                alerts: { ...prev.alerts, price: value },
              }))
            }
          />
          <ToggleRow
            label="Portfolio summaries"
            description="Daily digest covering overall performance, deposits, and risk flags."
            enabled={settings.alerts.portfolio}
            onToggle={(value) =>
              setSettings((prev) => ({
                ...prev,
                alerts: { ...prev.alerts, portfolio: value },
              }))
            }
          />
          {/* compliance reminders removed per settings cleanup */}
        </section>

        {/* Security - Change Password */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Lock className="size-5 text-blue-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Security</h2>
              <p className="text-xs text-slate-500">
                Change your account password to maintain security.
              </p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              <CheckCircle2 className="size-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Password changed successfully!</p>
                <p className="text-xs text-emerald-300 mt-1">Your password has been updated.</p>
              </div>
            </div>
          )}

          {passwordError && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <span className="text-lg">âš </span>
              <p>{passwordError}</p>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Field
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={setCurrentPassword}
            />
            <Field
              label="New password"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
            />
            <Field
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />

            <button
              type="submit"
              disabled={passwordChanging}
              className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {passwordChanging ? "Changing..." : "Change password"}
            </button>
          </form>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-blue-400 hover:to-purple-500"
          >
            Save changes
          </button>
          {saved && (
            <div className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-5 py-2 text-xs font-semibold text-emerald-300">
              Settings updated
            </div>
          )}
        </div>
      </form>

      <aside className="mt-8 grid gap-4 md:grid-cols-2">
        <SnapshotCard
          title="Portfolio balance"
          value={summary?.totalValue ?? 0}
          description="Total managed balance across all strategies."
          loading={loading}
        />
        <SnapshotCard
          title="Wallet balance"
          value={wallet?.balance ?? 0}
          description="Liquid funds ready for deployment."
          loading={loading}
        />
      </aside>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="block text-sm text-slate-300">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      />
    </label>
  );
}

function ToggleRow({ label, description, enabled, onToggle }) {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 md:flex-row md:items-center">
      <div>
        <p className="font-semibold text-white">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onToggle(!enabled)}
        className={`flex h-8 w-14 items-center rounded-full border transition ${
          enabled ? "border-blue-400 bg-blue-500/20 justify-end" : "border-white/10 bg-white/5 justify-start"
        }`}
      >
        <span className={`mx-1 size-6 rounded-full bg-white transition ${enabled ? "translate-x-0" : ""}`} />
      </button>
    </div>
  );
}

function SnapshotCard({ title, value, description, loading }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-blue-400/40">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">
        {loading
          ? "Loading..."
          : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value ?? 0)}
      </p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}
