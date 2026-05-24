import type { Service } from '@/types';
import { db } from '../db/store';
import { delay } from '../utils';

export interface ServiceListFilter {
  pipelineId?: string;
}

export const servicesServiceMock = {
  async list(filter?: ServiceListFilter): Promise<Service[]> {
    await delay();
    let result = [...db.services];
    if (filter?.pipelineId) result = result.filter((s) => s.pipelineId === filter.pipelineId);
    return result;
  },

  async getById(id: string): Promise<Service | undefined> {
    await delay();
    return db.services.find((s) => s.id === id);
  },

  async create(data: Omit<Service, 'id'>): Promise<Service> {
    await delay(150);
    const svc: Service = { ...data, id: `svc-${Date.now()}` };
    db.services.push(svc);
    return svc;
  },

  async update(id: string, data: Partial<Service>): Promise<Service> {
    await delay(120);
    db.services = db.services.map((s) => (s.id === id ? { ...s, ...data } : s));
    return db.services.find((s) => s.id === id)!;
  },

  async remove(id: string): Promise<void> {
    await delay(100);
    db.services = db.services.filter((s) => s.id !== id);
  },
};
