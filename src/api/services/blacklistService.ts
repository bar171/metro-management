import type { BlacklistEntry } from '@/types';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export const blacklistServiceReal = {
  list: () => apiClient.get<BlacklistEntry[]>(endpoints.blacklist.list),

  add: (data: Omit<BlacklistEntry, 'id' | 'createdAt' | 'active'>) =>
    apiClient.post<BlacklistEntry>(endpoints.blacklist.list, data),

  toggle: (id: string) => apiClient.post<BlacklistEntry>(endpoints.blacklist.toggle(id)),

  remove: (id: string) => apiClient.delete<void>(endpoints.blacklist.byId(id)),
};
