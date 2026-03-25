import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoaderOverlay } from "./LoaderOverlay";

export function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, initializing, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading while authentication is being initialized or checked
  if (loading || initializing) {
    return <LoaderOverlay show label="Verifying access..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
