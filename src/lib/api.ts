import { pipelineOrm, serviceOrm, resourceProfileOrm, metricOrm, logOrm, groupOrm } from './mockOrm';
import { mockBackfillApi } from './backfill';
import { mockBlacklistApi } from './blacklist';
import type { Pipeline, Service, ResourceProfile, MetricSnapshot, LogEntry, Group, BackfillRequest, BlacklistEntry } from '@/types';

// API Layer abstractions wrapping the mock ORM.
// These functions can be replaced with real fetch/axios calls to a backend.

export const pipelineApi = {
    fetchPipelines: (filter?: { environment?: string }) => pipelineOrm.findMany(filter),
    getPipeline: (id: string) => pipelineOrm.findById(id),
    createPipeline: (data: Omit<Pipeline, 'id'>) => pipelineOrm.create(data),
    updatePipeline: (id: string, data: Partial<Pipeline>) => pipelineOrm.update(id, data),
    deletePipeline: (id: string) => pipelineOrm.delete(id),
};

export const groupApi = {
    fetchGroups: (filter?: { primaryPipelineId?: string }) => groupOrm.findMany(filter),
    getGroup: (id: string) => groupOrm.findById(id),
    createGroup: (data: Omit<Group, 'id' | 'lastActive'>) => groupOrm.create(data),
    updateGroup: (id: string, data: Partial<Group>) => groupOrm.update(id, data),
    deleteGroup: (id: string) => groupOrm.delete(id),
};

export const serviceApi = {
    fetchServices: (filter?: { pipelineId?: string }) => serviceOrm.findMany(filter),
    getService: (id: string) => serviceOrm.findById(id),
    createService: (data: Omit<Service, 'id'>) => serviceOrm.create(data),
    updateService: (id: string, data: Partial<Service>) => serviceOrm.update(id, data),
    deleteService: (id: string) => serviceOrm.delete(id),
};

export const resourceProfileApi = {
    fetchProfiles: () => resourceProfileOrm.findMany(),
};

export const metricApi = {
    fetchMetrics: (filter?: { pipelineId?: string; type?: string }) => metricOrm.findMany(filter),
    appendMetric: (data: Omit<MetricSnapshot, 'id'>) => metricOrm.append(data),
};

export const logApi = {
    fetchLogs: (filter?: { pipelineId?: string; serviceId?: string; severity?: string; limit?: number }) => logOrm.findMany(filter),
    appendLog: (data: Omit<LogEntry, 'id'>) => logOrm.append(data),
};

export const backfillApi = {
    submitRequest: (request: BackfillRequest) => mockBackfillApi.submit(request),
};

export const blacklistApi = {
    fetchEntries: () => mockBlacklistApi.fetchEntries(),
    toggleEntry: (id: string) => mockBlacklistApi.toggleEntry(id),
    addEntry: (data: Omit<BlacklistEntry, 'id' | 'createdAt' | 'active'>) => mockBlacklistApi.addEntry(data),
    deleteEntry: (id: string) => mockBlacklistApi.deleteEntry(id),
};
