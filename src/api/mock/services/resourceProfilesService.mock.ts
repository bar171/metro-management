import type { ResourceProfile } from '@/types';
import { db } from '../db/store';
import { delay } from '../utils';

export const resourceProfilesServiceMock = {
  async list(): Promise<ResourceProfile[]> {
    await delay();
    return [...db.resourceProfiles];
  },

  async getById(id: string): Promise<ResourceProfile | undefined> {
    await delay();
    return db.resourceProfiles.find((r) => r.id === id);
  },

  async update(id: string, data: Partial<ResourceProfile>): Promise<ResourceProfile> {
    await delay(120);
    db.resourceProfiles = db.resourceProfiles.map((r) => (r.id === id ? { ...r, ...data } : r));
    return db.resourceProfiles.find((r) => r.id === id)!;
  },
};
