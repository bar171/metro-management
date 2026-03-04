import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import PipelinesPage from "./pages/PipelinesPage";

import MetricsPage from "./pages/MetricsPage";
import ServicesPage from "./pages/ResourcesPage";
import LivenessPage from "./pages/LivenessPage";
import StoragePage from "./pages/StoragePage";
import BlacklistPage from "./pages/BlacklistPage";
import BackfillPage from "./pages/BackfillPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pipelines" element={<PipelinesPage />} />
            <Route path="/liveness" element={<LivenessPage />} />
            <Route path="/storage" element={<StoragePage />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/blacklist" element={<BlacklistPage />} />
            <Route path="/backfill" element={<BackfillPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
