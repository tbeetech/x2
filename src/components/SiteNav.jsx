import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Activity, ChevronDown, Bell, User, Settings, ShieldCheck, History, LogOut, ChevronRight, Archive } from "lucide-react";
import { useAccountData } from "../context/AccountDataContext";
import { useAuth } from "../context/AuthContext";
import { useSiteContent } from "../context/SiteContentContext.jsx";

const BASE_LINKS = [
  { to: "/dashboard", key: "nav.links.dashboard", fallback: "Dashboard" },
  { to: "/market", key: "nav.links.market", fallback: "Markets" },
  { to: "/investments", key: "nav.links.investments", fallback: "Investments" },
  { to: "/pnl", key: "nav.links.pnl", fallback: "Daily P&L" },
  { to: "/help-center", key: "nav.links.support", fallback: "Support" },
];

const PROFILE_LINKS = [
  { to: "/personal-data", label: "Personal data", description: "Update personal details" },
  { to: "/settings", label: "Settings", description: "Security & preferences" },
  { to: "/verification", label: "Verification", description: "Document status & uploads" },
];

export function SiteNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user: accountUser, isAuthenticated, notifications = [], actions } = useAccountData();
  const { user: authUser, logout } = useAuth();
  const user = accountUser ?? authUser;
  const { getString } = useSiteContent();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState('unread'); // 'unread' or 'archived'
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const links = useMemo(() => {
    const items = BASE_LINKS.map(({ key, fallback, ...rest }) => ({
      ...rest,
      label: getString(key, fallback),
    }));
    if (user?.role === "admin") {
      items.push({ to: "/admin", label: getString("nav.links.admin", "Admin") });
    }
    return items;
  }, [getString, user]);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    setProfileOpen(false);
    setMobileProfileOpen(false);
  };

  useEffect(() => {
    if (!profileOpen) return;
    const handleClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    const handleKey = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [profileOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const handleClick = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    const handleKey = (event) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [notificationsOpen]);

  const initials = useMemo(() => {
    if (!user) return "";
    const first = user.firstName?.[0] ?? "";
    const last = user.lastName?.[0] ?? "";
    const fallback = user.email?.[0] ?? "";
    return `${(first + last || fallback).toUpperCase().slice(0, 2)}`;
  }, [user]);

  const userCountry = user?.country ?? getString("profile.country.missing", "Country not set");

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 bg-slate-900/70 backdrop-blur-md border-b border-white/10 h-[72px]">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 h-full">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex flex-col leading-none">
            <span className="text-lg font-black tracking-widest text-white">XFA</span>
            <span className="text-[0.5rem] tracking-widest uppercase text-blue-400">A division of Marex</span>
          </div>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-slate-100 md:flex">
          {links.map((link) => (
            <NavLink
              key={`desktop-nav-${link.to}`}
              to={link.to}
              className={({ isActive }) =>
                `text-sm transition hover:text-blue-400 ${isActive ? "text-blue-400" : "text-slate-200"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          
          {/* Notifications Navigation Link */}
          {isAuthenticated && (
            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `relative flex items-center gap-1.5 text-sm transition hover:text-blue-400 ${isActive ? "text-blue-400" : "text-slate-200"}`
              }
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              <span>Notifications</span>
              {notifications.filter(n => !n.read && !n.archived).length > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {notifications.filter(n => !n.read && !n.archived).length > 9 ? "9+" : notifications.filter(n => !n.read && !n.archived).length}
                </span>
              )}
            </NavLink>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-blue-400/70 hover:bg-slate-700 hover:text-white"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                  {initials || <Activity className="size-4" />}
                </span>
                <span className="text-left">
                  <span className="block leading-tight text-white">{user?.firstName ?? "Account"}</span>
                  <span className="block text-xs font-normal text-slate-300">{userCountry}</span>
                </span>
                <ChevronDown className={`size-4 transition ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 mt-3 w-60 rounded-2xl border border-white/10 bg-slate-900/95 p-4 text-sm text-slate-200 shadow-xl shadow-blue-500/20"
                  role="menu"
                  tabIndex={-1}
                >
                  <div className="flex items-start gap-3 border-b border-white/5 pb-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-blue-500/20 text-base font-semibold text-blue-200">
                      {initials || <Activity className="size-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="truncate text-xs text-slate-400">{user?.email}</p>
                      <p className="truncate text-xs text-slate-400">{userCountry}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {PROFILE_LINKS.map((item) => (
                      <Link
                        key={`desktop-profile-${item.to}`}
                        to={item.to}
                        className="block rounded-2xl border border-white/5 px-3 py-2 text-left text-sm font-semibold text-blue-300 transition hover:border-blue-500/40 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfileOpen(false);
                        }}
                        role="menuitem"
                      >
                        <span className="block">{item.label}</span>
                        <span className="text-xs font-normal text-slate-400">{item.description}</span>
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full rounded-lg border border-white/10 px-3 py-2 text-center text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-blue-500/60 px-5 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/10"
              >
                {getString("nav.actions.login", "Login")}
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-400 hover:to-purple-500"
              >
                {getString("nav.actions.signup", "Get Started")}
              </Link>
            </>
          )}

          {isAuthenticated && (
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen((s) => !s)}
                className="relative rounded-full border border-white/20 bg-slate-800 p-2 text-slate-100 transition hover:border-blue-400/70 hover:bg-slate-700"
                aria-label="Notifications"
              >
                <Bell className="size-5 text-blue-200" />
                {notifications.filter(n => !n.read && !n.archived).length > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
                    {notifications.filter(n => !n.read && !n.archived).length > 9 ? "9+" : notifications.filter(n => !n.read && !n.archived).length}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div 
                  className="absolute right-0 mt-3 w-full sm:w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-sm p-3 text-sm text-slate-200 shadow-xl z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Tab Headers */}
                  <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotificationTab('unread');
                      }}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        notificationTab === 'unread'
                          ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      Unread ({notifications.filter(n => !n.read && !n.archived).length})
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotificationTab('archived');
                      }}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        notificationTab === 'archived'
                          ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      Archived ({notifications.filter(n => n.archived).length})
                    </button>
                  </div>

                  {/* Notification List */}
                  <div className="space-y-2 max-h-96 overflow-auto">
                    {notificationTab === 'unread' ? (
                      // Unread Notifications
                      notifications.filter(n => !n.read && !n.archived).length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-center text-xs text-slate-400">
                          No unread notifications
                        </div>
                      ) : (
                        notifications.filter(n => !n.read && !n.archived).map((note) => (
                          <div
                            key={note.id}
                            className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3 group hover:bg-blue-500/15 transition"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white">{note.title || note.type}</p>
                                <p className="mt-1 text-xs text-slate-300 line-clamp-2">{note.body}</p>
                                <p className="mt-1 text-xs text-slate-500">{new Date(note.createdAt).toLocaleString()}</p>
                              </div>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    if (actions?.archiveNotification) await actions.archiveNotification(note.id);
                                  } catch (error) {
                                    console.error("Failed to archive notification:", error);
                                  }
                                }}
                                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-blue-500/30 text-slate-400 hover:text-blue-200"
                                title="Archive notification"
                              >
                                <Archive className="size-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )
                    ) : (
                      // Archived Notifications
                      notifications.filter(n => n.archived).length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-center text-xs text-slate-400">
                          No archived notifications
                        </div>
                      ) : (
                        notifications.filter(n => n.archived).map((note) => (
                          <div
                            key={note.id}
                            className="rounded-2xl border border-white/10 bg-white/5 p-3 opacity-70 hover:opacity-100 transition"
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-300">{note.title || note.type}</p>
                                <p className="mt-1 text-xs text-slate-400 line-clamp-2">{note.body}</p>
                                <p className="mt-1 text-xs text-slate-500">{new Date(note.createdAt).toLocaleString()}</p>
                              </div>
                              <span className="flex-shrink-0 text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                                Archived
                              </span>
                            </div>
                          </div>
                        ))
                      )
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 text-center">
                    <Link 
                      to="/notifications" 
                      className="inline-block text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotificationsOpen(false);
                      }}
                    >
                      View all notifications →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {isAuthenticated && (
            <>
              {/* Mobile Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen((s) => !s);
                    setMobileOpen(false);
                  }}
                  className="relative flex size-10 items-center justify-center rounded-full border border-white/20 bg-slate-800 text-white transition hover:border-blue-400/70 hover:bg-slate-700 active:scale-95"
                  aria-label="Notifications"
                >
                  <Bell className="size-5 text-blue-200" />
                  {notifications.filter(n => !n.read && !n.archived).length > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {notifications.filter(n => !n.read && !n.archived).length > 9 ? "9+" : notifications.filter(n => !n.read && !n.archived).length}
                    </span>
                  )}
                </button>
              </div>
            </>
          )}
          <button
            className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-slate-800 text-white transition hover:border-blue-400/70 hover:bg-slate-700 active:scale-95"
            onClick={() => {
              setNotificationsOpen(false);
              setMobileOpen((open) => !open);
            }}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>
      </header>

      {/* Mobile menu dropdown - Completely rebuilt */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setMobileOpen(false);
              setMobileProfileOpen(false);
            }}
          />
          
          {/* Menu Panel */}
          <div className="absolute top-[72px] left-0 right-0 bottom-0 bg-slate-900 overflow-y-auto">
            <div className="px-4 py-6 space-y-6">
              {/* Navigation Links */}
              <nav className="space-y-2">
                {links.map((link) => (
                  <NavLink
                    key={`mobile-nav-${link.to}`}
                    to={link.to}
                    className={({ isActive }) =>
                      `block rounded-lg px-4 py-3 text-sm font-medium transition ${
                        isActive 
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
                          : "text-slate-200 hover:bg-white/10 hover:text-white"
                      }`
                    }
                    onClick={() => {
                      setMobileOpen(false);
                      setMobileProfileOpen(false);
                    }}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>

              {/* Profile Section for authenticated users */}
              {isAuthenticated && (
                <div className="pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileProfileOpen(true);
                      setMobileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 hover:border-blue-400/50 transition"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                      <span className="text-sm font-bold">
                        {initials || <User className="size-5" />}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">Profile</p>
                      <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <ChevronRight className="size-5 text-slate-400" />
                  </button>
                </div>
              )}

              {/* Login/Signup for non-authenticated users */}
              {!isAuthenticated && (
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <Link
                    to="/login"
                    className="block w-full rounded-lg border border-blue-500/50 px-4 py-3 text-center text-sm font-semibold text-blue-300 hover:bg-blue-500/10 transition"
                    onClick={() => setMobileOpen(false)}
                  >
                    {getString("nav.actions.login", "Login")}
                  </Link>
                  <Link
                    to="/signup"
                    className="block w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-center text-sm font-semibold text-white hover:from-blue-400 hover:to-purple-500 transition shadow-lg shadow-blue-500/20"
                    onClick={() => setMobileOpen(false)}
                  >
                    {getString("nav.actions.signup", "Get Started")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Profile Panel - Full screen overlay */}
      {mobileProfileOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={() => setMobileProfileOpen(false)}
          />
          
          {/* Profile panel - slides from right */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-slate-900 border-l border-white/10 shadow-2xl z-[70] overflow-hidden flex flex-col animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-800/50">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/30 border-2 border-blue-400/50">
                  <span className="text-sm font-bold text-blue-100">
                    {initials || <User className="size-4" />}
                  </span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileProfileOpen(false)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition"
                aria-label="Close profile menu"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Profile menu items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <Link
                to="/personal-data"
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:bg-white/10 hover:border-blue-500/30 transition group"
                onClick={() => setMobileProfileOpen(false)}
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30">
                  <User className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Personal Data</p>
                  <p className="text-xs text-slate-400">Update personal details</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-slate-500 group-hover:text-blue-400" />
              </Link>

              <Link
                to="/settings"
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:bg-white/10 hover:border-blue-500/30 transition group"
                onClick={() => setMobileProfileOpen(false)}
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30">
                  <Settings className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Settings</p>
                  <p className="text-xs text-slate-400">Security & preferences</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-slate-500 group-hover:text-blue-400" />
              </Link>

              <Link
                to="/verification"
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:bg-white/10 hover:border-blue-500/30 transition group"
                onClick={() => setMobileProfileOpen(false)}
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Verification</p>
                  <p className="text-xs text-slate-400">Document status & uploads</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-slate-500 group-hover:text-blue-400" />
              </Link>

              <Link
                to="/transactions"
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:bg-white/10 hover:border-blue-500/30 transition group"
                onClick={() => setMobileProfileOpen(false)}
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30">
                  <History className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Transaction History</p>
                  <p className="text-xs text-slate-400">View all transactions</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-slate-500 group-hover:text-blue-400" />
              </Link>

              <Link
                to="/notifications"
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:bg-white/10 hover:border-blue-500/30 transition group"
                onClick={() => setMobileProfileOpen(false)}
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30">
                  <Bell className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Notifications</p>
                  <p className="text-xs text-slate-400">View all notifications</p>
                </div>
                <div className="flex items-center gap-2">
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-rose-500 rounded-full">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                  <ChevronRight className="size-5 shrink-0 text-slate-500 group-hover:text-blue-400" />
                </div>
              </Link>
            </div>

            {/* Footer with logout */}
            <div className="px-4 py-3 border-t border-white/10 bg-slate-800/50">
              <button
                type="button"
                onClick={async () => {
                  await handleLogout();
                  setMobileProfileOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition font-semibold active:scale-95"
              >
                <LogOut className="size-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile Notification Panel - Full screen overlay */}
      {notificationsOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden"
            onClick={() => setNotificationsOpen(false)}
          />
          
          {/* Notification panel - slides from right */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-slate-900 border-l border-white/10 shadow-2xl z-[70] overflow-hidden flex flex-col animate-slide-in-right md:hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-800/50">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="size-4 text-blue-400" />
                Notifications
                {notifications.filter(n => !n.read && !n.archived).length > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-rose-500 rounded-full">
                    {notifications.filter(n => !n.read && !n.archived).length}
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setNotificationsOpen(false)}
                className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition"
                aria-label="Close notifications"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Tab Headers */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-slate-800/30">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNotificationTab('unread');
                }}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  notificationTab === 'unread'
                    ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                Unread ({notifications.filter(n => !n.read && !n.archived).length})
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNotificationTab('archived');
                }}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  notificationTab === 'archived'
                    ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                Archived ({notifications.filter(n => n.archived).length})
              </button>
            </div>

            {/* Notifications list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {notificationTab === 'unread' ? (
                // Unread Notifications
                notifications.filter(n => !n.read && !n.archived).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-slate-800 mb-3">
                      <Bell className="size-8 text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-400">No unread notifications</p>
                    <p className="text-xs text-slate-500 mt-1">We'll notify you when something arrives</p>
                  </div>
                ) : (
                  notifications.filter(n => !n.read && !n.archived).map((note) => (
                    <div
                      key={note.id}
                      className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-white flex-1">{note.title || note.type}</p>
                        <span className="flex size-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{note.body}</p>
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <p className="text-[10px] text-slate-500">{new Date(note.createdAt).toLocaleString()}</p>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              if (actions?.archiveNotification) await actions.archiveNotification(note.id);
                            } catch (error) {
                              console.error("Failed to archive notification:", error);
                            }
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-semibold transition active:scale-95"
                        >
                          <Archive className="size-3" />
                          Archive
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                // Archived Notifications
                notifications.filter(n => n.archived).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-slate-800 mb-3">
                      <Archive className="size-8 text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-400">No archived notifications</p>
                    <p className="text-xs text-slate-500 mt-1">Archived items will appear here</p>
                  </div>
                ) : (
                  notifications.filter(n => n.archived).map((note) => (
                    <div
                      key={note.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-3 opacity-70"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-300 flex-1">{note.title || note.type}</p>
                        <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded flex-shrink-0">
                          Archived
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{note.body}</p>
                      <p className="text-[10px] text-slate-500 mt-2">{new Date(note.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )
              )}
            </div>

            {/* Footer */}
            {(notificationTab === 'unread' ? notifications.filter(n => !n.read && !n.archived).length : notifications.filter(n => n.archived).length) > 0 && (
              <div className="px-4 py-3 border-t border-white/10 bg-slate-800/50">
                <Link 
                  to="/notifications" 
                  className="block text-center text-sm font-semibold text-blue-400 hover:text-blue-300 transition"
                  onClick={() => setNotificationsOpen(false)}
                >
                  View all notifications →
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
