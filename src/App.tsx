import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AffiliateLayout } from "@/components/AffiliateLayout";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Afiliados from "./pages/Afiliados.tsx";
import AffiliateDashboard from "./pages/AffiliateDashboard.tsx";
import Saques from "./pages/Saques.tsx";
import Contas from "./pages/Contas.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Login */}
          <Route path="/" element={<Index />} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            }
          />
          <Route
            path="/admin/afiliados"
            element={
              <DashboardLayout>
                <Afiliados />
              </DashboardLayout>
            }
          />
          <Route
            path="/admin/saques"
            element={
              <DashboardLayout>
                <Saques />
              </DashboardLayout>
            }
          />
          <Route
            path="/admin/contas"
            element={
              <DashboardLayout>
                <Contas />
              </DashboardLayout>
            }
          />

          <Route
            path="/painel"
            element={
              <AffiliateLayout>
                <AffiliateDashboard />
              </AffiliateLayout>
            }
          />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
