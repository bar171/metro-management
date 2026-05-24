import type { BlacklistEntry } from '@/types';
import { db } from '../db/store';
import { delay } from '../utils';

export const blacklistServiceMock = {
  async list(): Promise<BlacklistEntry[]> {
    await delay(100);
    return [...db.blacklist];
  },

  async add(data: Omit<BlacklistEntry, 'id' | 'createdAt' | 'active'>): Promise<BlacklistEntry> {
    await delay(200);
    const newEntry: BlacklistEntry = {
      ...data,
      id: `bl-${Date.now()}`,
      createdAt: new Date().toISOString(),
      active: true,
    };
    db.blacklist.unshift(newEntry);
    return newEntry;
  },

  async toggle(id: string): Promise<BlacklistEntry> {
    await delay(150);
    const entry = db.blacklist.find((e) => e.id === id);
    if (!entry) throw new Error('Blacklist entry not found');
    entry.active = !entry.active;
    return { ...entry };
  },

  async remove(id: string): Promise<void> {
    await delay(100);
    db.blacklist = db.blacklist.filter((e) => e.id !== id);
  },
};
