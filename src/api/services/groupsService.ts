import type { Group } from '@/types';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { GroupListFilter } from '../mock/services/groupsService.mock';

export const groupsServiceReal = {
  list: (filter?: GroupListFilter) =>
    apiClient.get<Group[]>(endpoints.groups.list, { query: { primaryPipelineId: filter?.primaryPipelineId } }),

  getById: (id: string) => apiClient.get<Group>(endpoints.groups.byId(id)),

  create: (data: Omit<Group, 'id' | 'lastActive'>) => apiClient.post<Group>(endpoints.groups.list, data),

  update: (id: string, data: Partial<Group>) => apiClient.patch<Group>(endpoints.groups.byId(id), data),

  remove: (id: string) => apiClient.delete<void>(endpoints.groups.byId(id)),
};
