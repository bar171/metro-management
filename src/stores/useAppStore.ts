import { create } from 'zustand';
import type { Axis, Customer, Service, ResourceProfile, MetricSnapshot, LogEntry, ThemeMode } from '@/types';
import { axisOrm, customerOrm, serviceOrm, resourceProfileOrm, metricOrm, logOrm } from '@/lib/mockOrm';

interface AppState {
  // Theme
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;

  // Environment filter
  envFilter: 'all' | 'prod' | 'dev';
  setEnvFilter: (e: 'all' | 'prod' | 'dev') => void;

  // Data
  axes: Axis[];
  customers: Customer[];
  services: Service[];
  resourceProfiles: ResourceProfile[];
  metrics: MetricSnapshot[];
  logs: LogEntry[];
  loading: boolean;

  // Selected
  selectedAxisId: string | null;
  setSelectedAxisId: (id: string | null) => void;

  // Actions
  loadAll: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshLogs: () => Promise<void>;
  updateService: (id: string, data: Partial<Service>) => Promise<void>;
  updateAxis: (id: string, data: Partial<Axis>) => Promise<void>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  appendMetric: (data: Omit<MetricSnapshot, 'id'>) => Promise<void>;
  appendLog: (data: Omit<LogEntry, 'id'>) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'dark',
  setTheme: (theme) => {
    document.documentElement.className = theme === 'light' ? '' : theme;
    set({ theme });
  },

  envFilter: 'all',
  setEnvFilter: (envFilter) => set({ envFilter }),

  axes: [],
  customers: [],
  services: [],
  resourceProfiles: [],
  metrics: [],
  logs: [],
  loading: true,

  selectedAxisId: null,
  setSelectedAxisId: (selectedAxisId) => set({ selectedAxisId }),

  loadAll: async () => {
    set({ loading: true });
    const [axes, customers, services, resourceProfiles, metrics, logs] = await Promise.all([
      axisOrm.findMany(),
      customerOrm.findMany(),
      serviceOrm.findMany(),
      resourceProfileOrm.findMany(),
      metricOrm.findMany(),
      logOrm.findMany({ limit: 100 }),
    ]);
    set({ axes, customers, services, resourceProfiles, metrics, logs, loading: false });
  },

  refreshMetrics: async () => {
    const metrics = await metricOrm.findMany();
    set({ metrics });
  },

  refreshLogs: async () => {
    const logs = await logOrm.findMany({ limit: 100 });
    set({ logs });
  },

  updateService: async (id, data) => {
    await serviceOrm.update(id, data);
    const services = await serviceOrm.findMany();
    set({ services });
  },

  updateAxis: async (id, data) => {
    await axisOrm.update(id, data);
    const axes = await axisOrm.findMany();
    set({ axes });
  },

  updateCustomer: async (id, data) => {
    await customerOrm.update(id, data);
    const customers = await customerOrm.findMany();
    set({ customers });
  },

  appendMetric: async (data) => {
    await metricOrm.append(data);
  },

  appendLog: async (data) => {
    await logOrm.append(data);
    const logs = await logOrm.findMany({ limit: 100 });
    set({ logs });
  },
}));
