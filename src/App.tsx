import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

import DashboardPage from '@/features/dashboard/DashboardPage';
import PipelinesPage from '@/features/pipelines/PipelinesPage';
import MetricsPage from '@/features/metrics/MetricsPage';
import ServicesPage from '@/features/services/ServicesPage';
import StoragePage from '@/features/storage/StoragePage';
import BlacklistPage from '@/features/blacklist/BlacklistPage';
import BackfillPage from '@/features/backfill/BackfillPage';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/pipelines" element={<PipelinesPage />} />
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
