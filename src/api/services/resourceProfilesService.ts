import type { ResourceProfile } from '@/types';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export const resourceProfilesServiceReal = {
  list: () => apiClient.get<ResourceProfile[]>(endpoints.resourceProfiles.list),

  getById: (id: string) =>
    apiClient.get<ResourceProfile>(`${endpoints.resourceProfiles.list}/${encodeURIComponent(id)}`),

  update: (id: string, data: Partial<ResourceProfile>) =>
    apiClient.patch<ResourceProfile>(`${endpoints.resourceProfiles.list}/${encodeURIComponent(id)}`, data),
};
