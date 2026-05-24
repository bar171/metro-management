import type { LogEntry } from '@/types';
import { db } from '../db/store';
import { delay, newId } from '../utils';

export interface LogListFilter {
  pipelineId?: string;
  serviceId?: string;
  severity?: string;
  limit?: number;
}

export const logsServiceMock = {
  async list(filter?: LogListFilter): Promise<LogEntry[]> {
    await delay();
    let result = [...db.logs];
    if (filter?.pipelineId) result = result.filter((l) => l.pipelineId === filter.pipelineId);
    if (filter?.serviceId) result = result.filter((l) => l.serviceId === filter.serviceId);
    if (filter?.severity) result = result.filter((l) => l.severity === filter.severity);
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (filter?.limit) result = result.slice(0, filter.limit);
    return result;
  },

  async append(data: Omit<LogEntry, 'id'>): Promise<LogEntry> {
    const log: LogEntry = { ...data, id: newId('log') };
    db.logs.unshift(log);
    if (db.logs.length > 500) db.logs = db.logs.slice(0, 500);
    return log;
  },
};
