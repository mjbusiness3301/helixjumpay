import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ComplianceProvider } from "@/contexts/ComplianceContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AffiliateLayout } from "@/components/AffiliateLayout";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Afiliados from "./pages/Afiliados.tsx";
import AffiliateDashboard from "./pages/AffiliateDashboard.tsx";
import AffiliateSettings from "./pages/AffiliateSettings.tsx";
import Saques from "./pages/Saques.tsx";
import Contas from "./pages/Contas.tsx";
import Historico from "./pages/Historico.tsx";
import AffiliateHistorico from "./pages/AffiliateHistorico.tsx";
import AffiliatePlano from "./pages/AffiliatePlano.tsx";
import AffiliateIndicados from "./pages/AffiliateIndicados.tsx";
import AffiliateNetwork from "./pages/AffiliateNetwork.tsx";
import AdminSettings from "./pages/AdminSettings.tsx";
import AuditLogs from "./pages/AuditLogs.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ComplianceProvider>
            <Routes>
              {/* Login */}
              <Route path="/" element={<Index />} />

              {/* Admin routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardLayout>
                      <Dashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/afiliados"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardLayout>
                      <Afiliados />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/saques"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardLayout>
                      <Saques />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/contas"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardLayout>
                      <Contas />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/historico"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardLayout>
                      <Historico />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/configuracoes"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardLayout>
                      <AdminSettings />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/auditoria"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardLayout>
                      <AuditLogs />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Admin compliance mode - view affiliate account */}
              <Route
                path="/admin/compliance"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AffiliateLayout>
                      <AffiliateDashboard />
                    </AffiliateLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/compliance/configuracoes"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AffiliateLayout>
                      <AffiliateSettings />
                    </AffiliateLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/compliance/historico"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AffiliateLayout>
                      <AffiliateHistorico />
                    </AffiliateLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/compliance/plano"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AffiliateLayout>
                      <AffiliatePlano />
                    </AffiliateLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/compliance/indicados"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AffiliateLayout>
                      <AffiliateIndicados />
                    </AffiliateLayout>
                  </ProtectedRoute>
                }
              />

              {/* Affiliate routes */}
              <Route
                path="/painel"
                element={
                  <ProtectedRoute requiredRole="affiliate">
                    <AffiliateLayout>
                      <AffiliateDashboard />
                    </AffiliateLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/painel/configuracoes"
                element={
                  <ProtectedRoute requiredRole="affiliate">
                    <AffiliateLayout>
                      <AffiliateSettings />
                    </AffiliateLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/painel/historico"
                element={
                  <ProtectedRoute requiredRole="affiliate">
                    <AffiliateLayout>
                      <AffiliateHistorico />
                    </AffiliateLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/painel/plano"
                element={
                  <ProtectedRoute requiredRole="affiliate">
                    <AffiliateLayout>
                      <AffiliatePlano />
                    </AffiliateLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/painel/indicados"
                element={
                  <ProtectedRoute requiredRole="affiliate">
                    <AffiliateLayout>
                      <AffiliateIndicados />
                    </AffiliateLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/painel/rede"
                element={
                  <ProtectedRoute requiredRole="affiliate">
                    <AffiliateLayout>
                      <AffiliateNetwork />
                    </AffiliateLayout>
                  </ProtectedRoute>
                }
              />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ComplianceProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
