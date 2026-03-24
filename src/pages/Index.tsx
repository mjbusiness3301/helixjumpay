import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AuthPage from "@/pages/AuthPage";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { session, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session && userRole === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (session && userRole === "affiliate") {
    return <Navigate to="/painel" replace />;
  }

  return <AuthPage />;
};

export default Index;
