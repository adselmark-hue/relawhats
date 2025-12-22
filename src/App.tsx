import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Reports from "@/pages/Reports";
import ReportWizard from "@/pages/ReportWizard";
import Alerts from "@/pages/Alerts";
import Clients from "@/pages/Clients";
import Connections from "@/pages/Connections";
import Services from "@/pages/Services";
import Variables from "@/pages/Variables";
import Plans from "@/pages/Plans";
import Profile from "@/pages/Profile";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/new" element={<ReportWizard />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/templates" element={<Reports />} />
              <Route path="/variables" element={<Variables />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/integrations" element={<Connections />} />
              <Route path="/services" element={<Services />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/settings" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;