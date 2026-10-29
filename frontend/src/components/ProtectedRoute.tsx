import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

// <Navigate> re-runs its redirect effect on every render. AnimatePresence keeps the
// outgoing route mounted during its exit animation, so a redirect rendered inside it
// keeps replacing the location and React throws "Maximum update depth exceeded".
// Redirecting once from a guarded effect avoids that feedback loop.
const Redirect = ({
  to,
  state,
}: {
  to: string;
  state?: Record<string, unknown>;
}) => {
  const navigate = useNavigate();
  const target = useRef({ to, state });
  useEffect(() => {
    navigate(target.current.to, { replace: true, state: target.current.state });
  }, [navigate]);
  return null;
};

const ProtectedRoute = ({
  children,
  permission,
  guestAccess = false,
}: {
  children: React.ReactNode;
  permission?: string;
  guestAccess?: boolean;
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) {
    if (guestAccess) return <>{children}</>;
    return <Redirect to="/login" state={{ from: location.pathname }} />;
  }
  if (permission && user.permissions?.[permission] === false) {
    const fallback = location.pathname === "/dashboard" ? "/" : "/dashboard";
    return <Redirect to={fallback} />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
