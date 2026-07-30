import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "./auth-store";
import { RouteLoadingFallback } from "@/components/ui/RouteLoadingFallback";

export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!isInitialized) return <RouteLoadingFallback />;

  if (!user) {
    return <Navigate to="/welcome" replace state={{ from: location.pathname }} />;
  }

  return children ? <>{children}</> : <Outlet />;
}

/** Inverse guard for auth pages themselves — an already-logged-in person shouldn't see /login again. */
export function GuestRoute({ children }: { children?: ReactNode }) {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const user = useAuthStore((s) => s.user);

  if (!isInitialized) return <RouteLoadingFallback />;
  if (user) return <Navigate to="/" replace />;

  return children ? <>{children}</> : <Outlet />;
}
