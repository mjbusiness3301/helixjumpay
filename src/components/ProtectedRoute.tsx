import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: "admin" | "affiliate";
}) {
  const { session, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    // Redirect to correct panel
    if (userRole === "admin") return <Navigate to="/admin" replace />;
    if (userRole === "affiliate") return <Navigate to="/painel" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
