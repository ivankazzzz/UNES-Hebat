import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isAuthenticated, isAdmin, isSuperAdmin, canAccessLaporanIndividu } from "@/lib/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  allowLaporanIndividu?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireSuperAdmin = false,
  allowLaporanIndividu = false
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        navigate("/login", {
          replace: true,
          state: { from: location },
        });
        return;
      }

      if (allowLaporanIndividu && !canAccessLaporanIndividu()) {
        navigate("/", { replace: true });
        return;
      }

      if (requireSuperAdmin && !isSuperAdmin()) {
        navigate("/", { replace: true });
        return;
      }

      if (requireAdmin && !isAdmin()) {
        navigate("/", { replace: true });
        return;
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [navigate, requireAdmin, requireSuperAdmin, allowLaporanIndividu, location]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
