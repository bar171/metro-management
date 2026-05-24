/**
 * Single store for shared app state.
 *
 * Holds UI-only slices (theme, envFilter, selectedPipelineId) AND, for now,
 * the cached server data + mutation actions. Per-feature hooks under
 * `src/hooks/data/` are the recommended consumers; new code should NOT
 * import the store directly except for the UI-only slices.
 *
 * The longer-term goal (called out in REFACTOR_PLAN.md §E.4) is to migrate
 * the server-data slices off this store into React Query. Today's refactor
 * preserves the existing data flow to keep behavior 1:1.
 */

import { create } from 'zustand';
import type {
  BackfillRequest,
  BlacklistEntry,
  Group,
  LogEntry,
  MetricSnapshot,
  Pipeline,
  ResourceProfile,
  Service,
  ThemeMode,
} from '@/types';
import {
  backfillService,
  blacklistService,
  groupsService,
  logsService,
  metricsService,
  pipelinesService,
  resourceProfilesService,
  servicesService,
} from '@/api/services';

type EnvFilter = 'all' | 'prod' | 'prep' | 'dev';

interface AppState {
  // ── UI state ────────────────────────────────────────────
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  envFilter: EnvFilter;
  setEnvFilter: (e: EnvFilter) => void;
  selectedPipelineId: string | null;
  setSelectedPipelineId: (id: string | null) => void;

  // ── Cached server data ──────────────────────────────────
  pipelines: Pipeline[];
  groups: Group[];
  services: Service[];
  resourceProfiles: ResourceProfile[];
  metrics: MetricSnapshot[];
  logs: LogEntry[];
  blacklistEntries: BlacklistEntry[];
  loading: boolean;

  // ── Actions ─────────────────────────────────────────────
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

  selectedPipelineId: null,
  setSelectedPipelineId: (selectedPipelineId) => set({ selectedPipelineId }),

  pipelines: [],
  groups: [],
  services: [],
  resourceProfiles: [],
  metrics: [],
  logs: [],
  blacklistEntries: [],
  loading: true,

  loadAll: async () => {
    set({ loading: true });
    const [pipelines, groups, services, resourceProfiles, metrics, logs, blacklistEntries] = await Promise.all([
      pipelinesService.list(),
      groupsService.list(),
      servicesService.list(),
      resourceProfilesService.list(),
      metricsService.list(),
      logsService.list({ limit: 100 }),
      blacklistService.list(),
    ]);
    set({ pipelines, groups, services, resourceProfiles, metrics, logs, blacklistEntries, loading: false });
  },

  refreshMetrics: async () => {
    const metrics = await metricsService.list();
    set({ metrics });
  },

  refreshLogs: async () => {
    const logs = await logsService.list({ limit: 100 });
    set({ logs });
  },

  updateService: async (id, data) => {
    await servicesService.update(id, data);
    const services = await servicesService.list();
    set({ services });
  },

  createPipeline: async (data) => {
    await pipelinesService.create(data);
    set({ pipelines: await pipelinesService.list() });
  },

  updatePipeline: async (id, data) => {
    await pipelinesService.update(id, data);
    set({ pipelines: await pipelinesService.list() });
  },

  updatePipelineResources: async (id, totalCpu, totalMem) => {
    await pipelinesService.update(id, { totalCpuLimit: totalCpu, totalMemoryLimit: totalMem });

    const svcs = await servicesService.list({ pipelineId: id });
    if (svcs.length > 0) {
      const cpuPerSvc = Math.floor(totalCpu / svcs.length);
      const memPerSvc = Math.floor(totalMem / svcs.length);
      for (const svc of svcs) {
        await servicesService.update(svc.id, { cpuLimit: cpuPerSvc, memoryLimit: memPerSvc });
      }
    }

    const [pipelines, services] = await Promise.all([pipelinesService.list(), servicesService.list()]);
    set({ pipelines, services });
  },

  deletePipeline: async (id) => {
    await pipelinesService.remove(id);
    const [pipelines, groups, services] = await Promise.all([
      pipelinesService.list(),
      groupsService.list(),
      servicesService.list(),
    ]);
    set({ pipelines, groups, services, selectedPipelineId: null });
  },

  createGroup: async (data) => {
    await groupsService.create(data);
    set({ groups: await groupsService.list() });
  },

  updateGroup: async (id, data) => {
    await groupsService.update(id, data);
    set({ groups: await groupsService.list() });
  },

  deleteGroup: async (id) => {
    await groupsService.remove(id);
    set({ groups: await groupsService.list() });
  },

  appendMetric: async (data) => {
    await metricsService.append(data);
  },

  appendLog: async (data) => {
    await logsService.append(data);
    set({ logs: await logsService.list({ limit: 100 }) });
  },

  broadBackfill: async (request) => {
    const response = await backfillService.submit(request);
    if (response.success) {
      // hook for future state updates
      void get();
    }
  },

  loadBlacklist: async () => {
    set({ blacklistEntries: await blacklistService.list() });
  },

  toggleBlacklist: async (id) => {
    await blacklistService.toggle(id);
    set({ blacklistEntries: await blacklistService.list() });
  },

  addBlacklist: async (data) => {
    await blacklistService.add(data);
    set({ blacklistEntries: await blacklistService.list() });
  },

  deleteBlacklist: async (id) => {
    await blacklistService.remove(id);
    set({ blacklistEntries: await blacklistService.list() });
  },
}));
