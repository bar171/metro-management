import { create } from 'zustand';
import type { Pipeline, Service, ResourceProfile, MetricSnapshot, LogEntry, ThemeMode, Group, BackfillRequest, BlacklistEntry } from '@/types';
import {
  pipelineApi,
  serviceApi,
  resourceProfileApi,
  metricApi,
  logApi,
  groupApi,
  backfillApi,
  blacklistApi
} from '@/lib/api';

interface AppState {
  // Theme
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;

  // Environment filter
  envFilter: 'all' | 'prod' | 'prep' | 'dev';
  setEnvFilter: (e: 'all' | 'prod' | 'prep' | 'dev') => void;

  // Data
  pipelines: Pipeline[];

  groups: Group[];
  services: Service[];
  resourceProfiles: ResourceProfile[];
  metrics: MetricSnapshot[];
  logs: LogEntry[];
  blacklistEntries: BlacklistEntry[];
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

  // Blacklist
  loadBlacklist: () => Promise<void>;
  toggleBlacklist: (id: string) => Promise<void>;
  addBlacklist: (data: Omit<BlacklistEntry, 'id' | 'createdAt' | 'active'>) => Promise<void>;
  deleteBlacklist: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'dark',
  setTheme: (theme) => {
    document.documentElement.className = theme === 'light' ? '' : theme;
    set({ theme });
  },

  envFilter: 'prod',
  setEnvFilter: (envFilter) => set({ envFilter }),

  pipelines: [],

  groups: [],
  services: [],
  resourceProfiles: [],
  metrics: [],
  logs: [],
  blacklistEntries: [],
  loading: true,

  selectedPipelineId: null,
  setSelectedPipelineId: (selectedPipelineId) => set({ selectedPipelineId }),

  loadAll: async () => {
    set({ loading: true });
    const [pipelines, groups, services, resourceProfiles, metrics, logs, blacklistEntries] = await Promise.all([
      pipelineApi.fetchPipelines(),
      groupApi.fetchGroups(),
      serviceApi.fetchServices(),
      resourceProfileApi.fetchProfiles(),
      metricApi.fetchMetrics(),
      logApi.fetchLogs({ limit: 100 }),
      blacklistApi.fetchEntries(),
    ]);
    set({ pipelines, groups, services, resourceProfiles, metrics, logs, blacklistEntries, loading: false });
  },

  refreshMetrics: async () => {
    const metrics = await metricApi.fetchMetrics();
    set({ metrics });
  },

  refreshLogs: async () => {
    const logs = await logApi.fetchLogs({ limit: 100 });
    set({ logs });
  },

  updateService: async (id, data) => {
    await serviceApi.updateService(id, data);
    const services = await serviceApi.fetchServices();
    set({ services });
  },

  createPipeline: async (data) => {
    await pipelineApi.createPipeline(data);
    const pipelines = await pipelineApi.fetchPipelines();
    set({ pipelines });
  },

  updatePipeline: async (id, data) => {
    await pipelineApi.updatePipeline(id, data);
    const pipelines = await pipelineApi.fetchPipelines();
    set({ pipelines });
  },

  updatePipelineResources: async (id, totalCpu, totalMem) => {
    // Update the pipeline's tracked total
    await pipelineApi.updatePipeline(id, { totalCpuLimit: totalCpu, totalMemoryLimit: totalMem });

    // Find all services for this pipeline
    const svcs = await serviceApi.fetchServices({ pipelineId: id });
    const count = svcs.length;
    if (count > 0) {
      // Option A: Distribute equally
      const cpuPerSvc = Math.floor(totalCpu / count);
      const memPerSvc = Math.floor(totalMem / count);

      // Update each service in mock DB
      for (const svc of svcs) {
        await serviceApi.updateService(svc.id, { cpuLimit: cpuPerSvc, memoryLimit: memPerSvc });
      }
    }

    // Refresh state
    const [pipelines, services] = await Promise.all([
      pipelineApi.fetchPipelines(),
      serviceApi.fetchServices()
    ]);
    set({ pipelines, services });
  },

  deletePipeline: async (id) => {
    await pipelineApi.deletePipeline(id);
    const [pipelines, groups, services] = await Promise.all([
      pipelineApi.fetchPipelines(),
      groupApi.fetchGroups(),
      serviceApi.fetchServices()
    ]);
    set({ pipelines, groups, services, selectedPipelineId: null });
  },

  createGroup: async (data) => {
    await groupApi.createGroup(data);
    const groups = await groupApi.fetchGroups();
    set({ groups });
  },

  updateGroup: async (id, data) => {
    await groupApi.updateGroup(id, data);
    const groups = await groupApi.fetchGroups();
    set({ groups });
  },

  deleteGroup: async (id) => {
    await groupApi.deleteGroup(id);
    const groups = await groupApi.fetchGroups();
    set({ groups });
  },



  appendMetric: async (data) => {
    await metricApi.appendMetric(data);
  },

  appendLog: async (data) => {
    await logApi.appendLog(data);
    const logs = await logApi.fetchLogs({ limit: 100 });
    set({ logs });
  },

  broadBackfill: async (request: BackfillRequest) => {
    const response = await backfillApi.submitRequest(request);
    if (response.success) {
      // In a real app we might update some state here
      console.log(`Backfill request ${response.requestId} submitted.`);
    }
  },

  loadBlacklist: async () => {
    const entries = await blacklistApi.fetchEntries();
    set({ blacklistEntries: entries });
  },

  toggleBlacklist: async (id) => {
    await blacklistApi.toggleEntry(id);
    const entries = await blacklistApi.fetchEntries();
    set({ blacklistEntries: entries });
  },

  addBlacklist: async (data) => {
    await blacklistApi.addEntry(data);
    const entries = await blacklistApi.fetchEntries();
    set({ blacklistEntries: entries });
  },

  deleteBlacklist: async (id) => {
    await blacklistApi.deleteEntry(id);
    const entries = await blacklistApi.fetchEntries();
    set({ blacklistEntries: entries });
  },
}));
