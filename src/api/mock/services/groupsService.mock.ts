import type { Group } from '@/types';
import { db } from '../db/store';
import { delay } from '../utils';

export interface GroupListFilter {
  primaryPipelineId?: string;
}

export const groupsServiceMock = {
  async list(filter?: GroupListFilter): Promise<Group[]> {
    await delay();
    let result = [...db.groups];
    if (filter?.primaryPipelineId) result = result.filter((g) => g.primaryPipelineId === filter.primaryPipelineId);
    return result;
  },

  async getById(id: string): Promise<Group | undefined> {
    await delay();
    return db.groups.find((g) => g.id === id);
  },

  async create(data: Omit<Group, 'id' | 'lastActive'>): Promise<Group> {
    await delay(150);
    const group: Group = { ...data, id: `group-${Date.now()}` } as Group;
    db.groups.push(group);
    return group;
  },

  async update(id: string, data: Partial<Group>): Promise<Group> {
    await delay(120);
    db.groups = db.groups.map((g) => (g.id === id ? { ...g, ...data } : g));
    return db.groups.find((g) => g.id === id)!;
  },

  async remove(id: string): Promise<void> {
    await delay(100);
    db.groups = db.groups.filter((g) => g.id !== id);
  },
};
