import { create } from 'zustand';
import type { Pipeline, Service, ResourceProfile, MetricSnapshot, LogEntry, ThemeMode, Group, BackfillRequest } from '@/types';
import { pipelineOrm, serviceOrm, resourceProfileOrm, metricOrm, logOrm, groupOrm } from '@/lib/mockOrm';
import { mockBackfillApi } from '@/lib/backfill';

interface AppState {
  // Theme
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;

  // Environment filter
  envFilter: 'all' | 'prod' | 'dev';
  setEnvFilter: (e: 'all' | 'prod' | 'dev') => void;

  // Data
  pipelines: Pipeline[];

  groups: Group[];
  services: Service[];
  resourceProfiles: ResourceProfile[];
  metrics: MetricSnapshot[];
  logs: LogEntry[];
  loading: boolean;

  // Selected
  selectedPipelineId: string | null;
  setSelectedPipelineId: (id: string | null) => void;

  // Actions
  loadAll: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshLogs: () => Promise<void>;
  updateService: (id: string, data: Partial<Service>) => Promise<void>;
  createPipeline: (data: Omit<Pipeline, 'id'>) => Promise<void>;
  updatePipeline: (id: string, data: Partial<Pipeline>) => Promise<void>;
  updatePipelineResources: (id: string, totalCpu: number, totalMem: number) => Promise<void>;
  deletePipeline: (id: string) => Promise<void>;
  createGroup: (data: Omit<Group, 'id' | 'lastActive'>) => Promise<void>;
  updateGroup: (id: string, data: Partial<Group>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;

  appendMetric: (data: Omit<MetricSnapshot, 'id'>) => Promise<void>;
  appendLog: (data: Omit<LogEntry, 'id'>) => Promise<void>;
  broadBackfill: (request: BackfillRequest) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'dark',
  setTheme: (theme) => {
    document.documentElement.className = theme === 'light' ? '' : theme;
    set({ theme });
  },

  envFilter: 'all',
  setEnvFilter: (envFilter) => set({ envFilter }),

  pipelines: [],

  groups: [],
  services: [],
  resourceProfiles: [],
  metrics: [],
  logs: [],
  loading: true,

  selectedPipelineId: null,
  setSelectedPipelineId: (selectedPipelineId) => set({ selectedPipelineId }),

  loadAll: async () => {
    set({ loading: true });
    const [pipelines, groups, services, resourceProfiles, metrics, logs] = await Promise.all([
      pipelineOrm.findMany(),

      groupOrm.findMany(),
      serviceOrm.findMany(),
      resourceProfileOrm.findMany(),
      metricOrm.findMany(),
      logOrm.findMany({ limit: 100 }),
    ]);
    set({ pipelines, groups, services, resourceProfiles, metrics, logs, loading: false });
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

  createPipeline: async (data) => {
    await pipelineOrm.create(data);
    const pipelines = await pipelineOrm.findMany();
    set({ pipelines });
  },

  updatePipeline: async (id, data) => {
    await pipelineOrm.update(id, data);
    const pipelines = await pipelineOrm.findMany();
    set({ pipelines });
  },

  updatePipelineResources: async (id, totalCpu, totalMem) => {
    // Update the pipeline's tracked total
    await pipelineOrm.update(id, { totalCpuLimit: totalCpu, totalMemoryLimit: totalMem });

    // Find all services for this pipeline
    const svcs = await serviceOrm.findMany({ pipelineId: id });
    const count = svcs.length;
    if (count > 0) {
      // Option A: Distribute equally
      const cpuPerSvc = Math.floor(totalCpu / count);
      const memPerSvc = Math.floor(totalMem / count);

      // Update each service in mock DB
      for (const svc of svcs) {
        await serviceOrm.update(svc.id, { cpuLimit: cpuPerSvc, memoryLimit: memPerSvc });
      }
    }

    // Refresh state
    const [pipelines, services] = await Promise.all([
      pipelineOrm.findMany(),
      serviceOrm.findMany()
    ]);
    set({ pipelines, services });
  },

  deletePipeline: async (id) => {
    await pipelineOrm.delete(id);
    const [pipelines, groups, services] = await Promise.all([
      pipelineOrm.findMany(),
      groupOrm.findMany(),
      serviceOrm.findMany()
    ]);
    set({ pipelines, groups, services, selectedPipelineId: null });
  },

  createGroup: async (data) => {
    await groupOrm.create(data);
    const groups = await groupOrm.findMany();
    set({ groups });
  },

  updateGroup: async (id, data) => {
    await groupOrm.update(id, data);
    const groups = await groupOrm.findMany();
    set({ groups });
  },

  deleteGroup: async (id) => {
    await groupOrm.delete(id);
    const groups = await groupOrm.findMany();
    set({ groups });
  },



  appendMetric: async (data) => {
    await metricOrm.append(data);
  },

  appendLog: async (data) => {
    const logs = await logOrm.findMany({ limit: 100 });
    set({ logs });
  },

  broadBackfill: async (request: BackfillRequest) => {
    const response = await mockBackfillApi.submit(request);
    if (response.success) {
      // In a real app we might update some state here
      console.log(`Backfill request ${response.requestId} submitted.`);
    }
  },
}));
