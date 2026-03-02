import type { Pipeline, Service, ResourceProfile, MetricSnapshot, LogEntry, Group } from '@/types';
import {
  generateResourceProfiles,
  generatePipelines,

  generateGroups,
  generateServices,
  generateMetrics,
  generateLogs,
} from './mockData';

// Simulated latency
const delay = (ms = 80) => new Promise(r => setTimeout(r, ms + Math.random() * 60));

// In-memory DB
let resourceProfiles = generateResourceProfiles();
let pipelines = generatePipelines();

let groups = generateGroups(pipelines);
let services = generateServices(pipelines);
let metrics = generateMetrics(pipelines, services);
let logs = generateLogs(pipelines, services);

// ── Background Simulation ──
setInterval(() => {
  // 1. Randomly flip a service status to "down" (degraded/lagging)
  if (Math.random() < 0.1 && services.length > 0) {
    const svc = services[Math.floor(Math.random() * services.length)];
    svc.status = Math.random() < 0.5 ? 'degraded' : 'lagging';
    // self-heal after some time
    setTimeout(() => { svc.status = 'healthy'; }, 15000 + Math.random() * 30000);
  }

  // 2. Update lastMessageAt for active pipelines
  pipelines.forEach(p => {
    if (Math.random() < 0.3) {
      p.lastMessageAt = new Date().toISOString();
    }
  });

  // 3. Simulate Kafka lag spikes
  if (Math.random() < 0.2) {
    const p = pipelines[Math.floor(Math.random() * pipelines.length)];
    const pServices = services.filter(s => s.pipelineId === p.id);
    const svc = pServices[Math.floor(Math.random() * pServices.length)];
    if (svc) {
      metricOrm.append({
        pipelineId: p.id,
        serviceId: svc.id,
        type: 'kafka_lag',
        value: 1200 + Math.random() * 5000,
        timestamp: new Date().toISOString()
      });
    }
  }
}, 5000);

// ── Resource Profiles ──
export const resourceProfileOrm = {
  async findMany(): Promise<ResourceProfile[]> {
    await delay();
    return [...resourceProfiles];
  },
  async findById(id: string): Promise<ResourceProfile | undefined> {
    await delay();
    return resourceProfiles.find(r => r.id === id);
  },
  async update(id: string, data: Partial<ResourceProfile>): Promise<ResourceProfile> {
    await delay(120);
    resourceProfiles = resourceProfiles.map(r => r.id === id ? { ...r, ...data } : r);
    return resourceProfiles.find(r => r.id === id)!;
  },
};

// ── Pipelines ──
export const pipelineOrm = {
  async findMany(filter?: { environment?: string }): Promise<Pipeline[]> {
    await delay();
    let result = [...pipelines];
    if (filter?.environment) result = result.filter(a => a.environment === filter.environment);
    return result;
  },
  async findById(id: string): Promise<Pipeline | undefined> {
    await delay();
    return pipelines.find(a => a.id === id);
  },
  async create(data: Omit<Pipeline, 'id'>): Promise<Pipeline> {
    await delay(150);
    const pipeline: Pipeline = { ...data, id: `pipeline-${Date.now()}` };
    pipelines.push(pipeline);
    return pipeline;
  },
  async update(id: string, data: Partial<Pipeline>): Promise<Pipeline> {
    await delay(120);
    pipelines = pipelines.map(a => a.id === id ? { ...a, ...data } : a);
    return pipelines.find(a => a.id === id)!;
  },
  async delete(id: string): Promise<void> {
    await delay(100);

    // Cascade: remove services
    services = services.filter(s => s.pipelineId !== id);
    pipelines = pipelines.filter(a => a.id !== id);
  },
};



// ── Groups ──
export const groupOrm = {
  async findMany(filter?: { primaryPipelineId?: string }): Promise<Group[]> {
    await delay();
    let result = [...groups];
    if (filter?.primaryPipelineId) result = result.filter(g => g.primaryPipelineId === filter.primaryPipelineId);
    return result;
  },
  async findById(id: string): Promise<Group | undefined> {
    await delay();
    return groups.find(g => g.id === id);
  },
  async create(data: Omit<Group, 'id' | 'lastActive'>): Promise<Group> {
    await delay(150);
    const group: Group = { ...data, id: `group-${Date.now()}`, lastActive: new Date().toISOString() };
    groups.push(group);
    return group;
  },
  async update(id: string, data: Partial<Group>): Promise<Group> {
    await delay(120);
    groups = groups.map(g => g.id === id ? { ...g, ...data } : g);
    return groups.find(g => g.id === id)!;
  },
  async delete(id: string): Promise<void> {
    await delay(100);
    groups = groups.filter(g => g.id !== id);
  }
};

// ── Services ──
export const serviceOrm = {
  async findMany(filter?: { pipelineId?: string }): Promise<Service[]> {
    await delay();
    let result = [...services];
    if (filter?.pipelineId) result = result.filter(s => s.pipelineId === filter.pipelineId);
    return result;
  },
  async findById(id: string): Promise<Service | undefined> {
    await delay();
    return services.find(s => s.id === id);
  },
  async update(id: string, data: Partial<Service>): Promise<Service> {
    await delay(120);
    services = services.map(s => s.id === id ? { ...s, ...data } : s);
    return services.find(s => s.id === id)!;
  },
  async create(data: Omit<Service, 'id'>): Promise<Service> {
    await delay(150);
    const svc: Service = { ...data, id: `svc-${Date.now()}` };
    services.push(svc);
    return svc;
  },
  async delete(id: string): Promise<void> {
    await delay(100);
    services = services.filter(s => s.id !== id);
  },
};

// ── Metrics ──
export const metricOrm = {
  async findMany(filter?: { pipelineId?: string; type?: string }): Promise<MetricSnapshot[]> {
    await delay();
    let result = [...metrics];
    if (filter?.pipelineId) result = result.filter(m => m.pipelineId === filter.pipelineId);
    if (filter?.type) result = result.filter(m => m.type === filter.type);
    return result;
  },
  async append(data: Omit<MetricSnapshot, 'id'>): Promise<MetricSnapshot> {
    const metric: MetricSnapshot = { ...data, id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    metrics.push(metric);
    // Keep only last 200 per pipeline/type
    const key = `${metric.pipelineId}_${metric.serviceId}_${metric.type}`;
    const grouped = metrics.filter(m => `${m.pipelineId}_${m.serviceId}_${m.type}` === key);
    if (grouped.length > 200) {
      const toRemove = new Set(grouped.slice(0, grouped.length - 200).map(m => m.id));
      metrics = metrics.filter(m => !toRemove.has(m.id));
    }
    return metric;
  },
};

// ── Logs ──
export const logOrm = {
  async findMany(filter?: { pipelineId?: string; serviceId?: string; severity?: string; limit?: number }): Promise<LogEntry[]> {
    await delay();
    let result = [...logs];
    if (filter?.pipelineId) result = result.filter(l => l.pipelineId === filter.pipelineId);
    if (filter?.serviceId) result = result.filter(l => l.serviceId === filter.serviceId);
    if (filter?.severity) result = result.filter(l => l.severity === filter.severity);
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (filter?.limit) result = result.slice(0, filter.limit);
    return result;
  },
  async append(data: Omit<LogEntry, 'id'>): Promise<LogEntry> {
    const log: LogEntry = { ...data, id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    logs.unshift(log);
    if (logs.length > 500) logs = logs.slice(0, 500);
    return log;
  },
};
