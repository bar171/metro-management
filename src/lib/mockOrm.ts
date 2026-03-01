import type { Axis, Customer, Service, ResourceProfile, MetricSnapshot, LogEntry } from '@/types';
import {
  generateResourceProfiles,
  generateAxes,
  generateCustomers,
  generateServices,
  generateMetrics,
  generateLogs,
} from './mockData';

// Simulated latency
const delay = (ms = 80) => new Promise(r => setTimeout(r, ms + Math.random() * 60));

// In-memory DB
let resourceProfiles = generateResourceProfiles();
let axes = generateAxes();
let customers = generateCustomers(axes);
let services = generateServices(axes);
let metrics = generateMetrics(axes);
let logs = generateLogs(axes, services);

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

// ── Axes ──
export const axisOrm = {
  async findMany(filter?: { environment?: string }): Promise<Axis[]> {
    await delay();
    let result = [...axes];
    if (filter?.environment) result = result.filter(a => a.environment === filter.environment);
    return result;
  },
  async findById(id: string): Promise<Axis | undefined> {
    await delay();
    return axes.find(a => a.id === id);
  },
  async create(data: Omit<Axis, 'id'>): Promise<Axis> {
    await delay(150);
    const axis: Axis = { ...data, id: `axis-${Date.now()}` };
    axes.push(axis);
    return axis;
  },
  async update(id: string, data: Partial<Axis>): Promise<Axis> {
    await delay(120);
    axes = axes.map(a => a.id === id ? { ...a, ...data } : a);
    return axes.find(a => a.id === id)!;
  },
  async delete(id: string): Promise<void> {
    await delay(100);
    // Cascade: unlink customers
    customers = customers.map(c => c.axisId === id ? { ...c, axisId: '' } : c);
    // Cascade: remove services
    services = services.filter(s => s.axisId !== id);
    axes = axes.filter(a => a.id !== id);
  },
};

// ── Customers ──
export const customerOrm = {
  async findMany(filter?: { axisId?: string }): Promise<Customer[]> {
    await delay();
    let result = [...customers];
    if (filter?.axisId) result = result.filter(c => c.axisId === filter.axisId);
    return result;
  },
  async findById(id: string): Promise<Customer | undefined> {
    await delay();
    return customers.find(c => c.id === id);
  },
  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    await delay(120);
    customers = customers.map(c => c.id === id ? { ...c, ...data } : c);
    return customers.find(c => c.id === id)!;
  },
  async create(data: Omit<Customer, 'id'>): Promise<Customer> {
    await delay(150);
    const customer: Customer = { ...data, id: `cust-${Date.now()}` };
    customers.push(customer);
    return customer;
  },
  async delete(id: string): Promise<void> {
    await delay(100);
    customers = customers.filter(c => c.id !== id);
  },
};

// ── Services ──
export const serviceOrm = {
  async findMany(filter?: { axisId?: string }): Promise<Service[]> {
    await delay();
    let result = [...services];
    if (filter?.axisId) result = result.filter(s => s.axisId === filter.axisId);
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
  async findMany(filter?: { axisId?: string; type?: string }): Promise<MetricSnapshot[]> {
    await delay();
    let result = [...metrics];
    if (filter?.axisId) result = result.filter(m => m.axisId === filter.axisId);
    if (filter?.type) result = result.filter(m => m.type === filter.type);
    return result;
  },
  async append(data: Omit<MetricSnapshot, 'id'>): Promise<MetricSnapshot> {
    const metric: MetricSnapshot = { ...data, id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    metrics.push(metric);
    // Keep only last 200 per axis/type
    const key = `${metric.axisId}_${metric.type}`;
    const grouped = metrics.filter(m => `${m.axisId}_${m.type}` === key);
    if (grouped.length > 200) {
      const toRemove = new Set(grouped.slice(0, grouped.length - 200).map(m => m.id));
      metrics = metrics.filter(m => !toRemove.has(m.id));
    }
    return metric;
  },
};

// ── Logs ──
export const logOrm = {
  async findMany(filter?: { axisId?: string; serviceId?: string; severity?: string; limit?: number }): Promise<LogEntry[]> {
    await delay();
    let result = [...logs];
    if (filter?.axisId) result = result.filter(l => l.axisId === filter.axisId);
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
