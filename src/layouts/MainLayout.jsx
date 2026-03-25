import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { SiteNav } from "../components/SiteNav";
import { SiteFooter } from "../components/SiteFooter";
import { useAccountData } from "../context/AccountDataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { LoaderOverlay } from "../components/LoaderOverlay";
import { trackPageview, trackError } from "../services/analytics";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { LiveTransferFeed } from "../components/LiveTransferFeed";

const PROTECTED_PATHS = [
  "/dashboard",
  "/market",
  "/transactions",
  "/settings",
  "/personal-data",
  "/verification",
  "/pnl",
  "/security",
  "/community",
  "/admin",
];

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, hasResolvedAuth, loading } = useAccountData();
  const { user } = useAuth();

  const isProtectedRoute = useMemo(() => {
    return PROTECTED_PATHS.some((path) =>
      location.pathname === path || location.pathname.startsWith(`${path}/`),
    );
  }, [location.pathname]);

  const requiresAdmin = useMemo(
    () => location.pathname === "/admin" || location.pathname.startsWith("/admin/"),
    [location.pathname],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    trackPageview(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (!hasResolvedAuth) {
      return;
    }

    if (!isProtectedRoute) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
      return;
    }

    if (requiresAdmin && user?.role !== "admin") {
      navigate("/dashboard", { replace: true });
    }
  }, [hasResolvedAuth, isAuthenticated, isProtectedRoute, requiresAdmin, user?.role, navigate, location.pathname]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <LoaderOverlay show={loading && !hasResolvedAuth} />
      <LiveTransferFeed />
      <SiteNav />
      <main className="pt-24">
        <ErrorBoundary
          onError={(error, info) => {
            trackError(error, { info, path: location.pathname });
          }}
          onReset={() => {
            trackPageview(location.pathname);
          }}
          fallback={({ reset }) => (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
              <h2 className="text-xl font-semibold text-white">We hit a snag.</h2>
              <p className="text-sm text-slate-400">
                The page failed to load correctly. You can try again, or head back to the dashboard.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Go to dashboard
                </button>
              </div>
            </div>
          )}
        >
          <Outlet />
        </ErrorBoundary>
      </main>
      <SiteFooter />
    </div>
  );
}
